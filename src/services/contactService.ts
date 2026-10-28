import {
  Contact,
  ContactField,
  requestPermissionsAsync,
  getPermissionsAsync,
} from 'expo-contacts';
import { Alert, Platform } from 'react-native';
import { VisitingCard } from '../types/card';

export interface ContactOperationResult {
  success: boolean;
  message?: string;
  contactName?: string;
}

/**
 * Checks or requests contact permissions
 */
export async function ensureContactPermission(): Promise<boolean> {
  try {
    const { status } = await getPermissionsAsync();
    if (status === 'granted') {
      return true;
    }

    const request = await requestPermissionsAsync();
    if (request.status === 'granted') {
      return true;
    }

    Alert.alert(
      'Permission Required',
      'Please allow contact access in device settings to save business cards to your contacts.'
    );
    return false;
  } catch (err) {
    console.warn('Error checking contact permissions:', err);
    return false;
  }
}

/**
 * Splits full person name into Given Name and Family Name
 */
function parsePersonName(fullName: string): { givenName: string; familyName?: string } {
  const trimmed = fullName.trim();
  if (!trimmed) return { givenName: 'Business Contact' };
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) {
    return { givenName: parts[0] };
  }
  return {
    givenName: parts.slice(0, -1).join(' '),
    familyName: parts[parts.length - 1],
  };
}

/**
 * Prepares phone records from card data
 */
function preparePhoneRecords(card: VisitingCard) {
  const phones: { label: string; number: string }[] = [];

  const mobiles = card.mobile_numbers && card.mobile_numbers.length > 0
    ? card.mobile_numbers
    : (card.contact_number ? card.contact_number.split(',').map(s => s.trim()).filter(Boolean) : []);

  mobiles.forEach((num, idx) => {
    phones.push({
      label: idx === 0 ? 'mobile' : `mobile ${idx + 1}`,
      number: num,
    });
  });

  const landlines = card.landline_numbers && card.landline_numbers.length > 0
    ? card.landline_numbers
    : (card.landline_number ? card.landline_number.split(',').map(s => s.trim()).filter(Boolean) : []);

  landlines.forEach((land, idx) => {
    phones.push({
      label: idx === 0 ? 'work' : `work ${idx + 1}`,
      number: land,
    });
  });

  return phones;
}

/**
 * Prepares email records from card data
 */
function prepareEmailRecords(card: VisitingCard) {
  const emails: { label: string; address: string }[] = [];
  const list = card.emails && card.emails.length > 0
    ? card.emails
    : (card.email ? [card.email] : []);

  list.forEach((em, idx) => {
    if (em.trim()) {
      emails.push({
        label: idx === 0 ? 'work' : `work ${idx + 1}`,
        address: em.trim(),
      });
    }
  });

  return emails;
}

/**
 * Prepares website records from card data
 */
function prepareUrlRecords(card: VisitingCard) {
  const urls: { label: string; url: string }[] = [];
  const list = card.websites && card.websites.length > 0
    ? card.websites
    : (card.website ? [card.website] : []);

  list.forEach(w => {
    if (w.trim()) {
      urls.push({
        label: 'work',
        url: w.trim().startsWith('http') ? w.trim() : `https://${w.trim()}`,
      });
    }
  });

  return urls;
}

/**
 * Creates a brand new contact on the device's address book
 * (Automatically syncs to Google Contacts on Android and iCloud on iOS)
 */
export async function createNewContact(card: VisitingCard): Promise<ContactOperationResult> {
  const hasPermission = await ensureContactPermission();
  if (!hasPermission) return { success: false, message: 'Permission denied' };

  try {
    const { givenName, familyName } = parsePersonName(card.person_name || card.business_name);
    const phones = preparePhoneRecords(card);
    const emails = prepareEmailRecords(card);
    const urls = prepareUrlRecords(card);

    let noteText = '';
    if (card.business_description) {
      noteText += `Specialization: ${card.business_description}\n`;
    }
    if (card.business_category) {
      noteText += `Category: ${card.business_category}\n`;
    }
    noteText += 'Added via Visiting Card Scanner';

    const addresses = card.address ? [
      {
        label: 'work',
        street: card.address,
        postalCode: card.pincode || '',
      }
    ] : [];

    const contact = await Contact.create({
      givenName,
      familyName,
      company: card.business_name || undefined,
      jobTitle: card.job_title || undefined,
      note: noteText,
      phones,
      emails,
      urlAddresses: urls,
      addresses,
    });

    const displayName = card.person_name || card.business_name;
    return {
      success: true,
      contactName: displayName,
      message: `Created contact for "${displayName}" in your address book.`,
    };
  } catch (err: any) {
    console.error('Failed to create new contact:', err);
    return {
      success: false,
      message: err?.message || 'Could not save contact to device.',
    };
  }
}

/**
 * Opens native contact picker to select an existing contact and appends
 * the visiting card information (phones, emails, company, notes).
 */
export async function addToExistingContact(card: VisitingCard): Promise<ContactOperationResult> {
  const hasPermission = await ensureContactPermission();
  if (!hasPermission) return { success: false, message: 'Permission denied' };

  try {
    // Open system contact picker
    const selectedContact = await Contact.presentPicker();
    if (!selectedContact) {
      return { success: false, message: 'No contact selected' };
    }

    // Retrieve existing contact details
    const existingDetails = await selectedContact.getDetails([
      ContactField.FULL_NAME,
      ContactField.GIVEN_NAME,
      ContactField.FAMILY_NAME,
      ContactField.COMPANY,
      ContactField.JOB_TITLE,
      ContactField.PHONES,
      ContactField.EMAILS,
      ContactField.URL_ADDRESSES,
      ContactField.ADDRESSES,
      ContactField.NOTE,
    ]);

    const existingPhones = existingDetails.phones || [];
    const existingEmails = existingDetails.emails || [];
    const existingUrls = existingDetails.urlAddresses || [];

    // Filter out duplicates
    const newPhones = preparePhoneRecords(card).filter(
      p => !existingPhones.some(ep => ep.number?.replace(/\D/g, '') === p.number.replace(/\D/g, ''))
    );

    const newEmails = prepareEmailRecords(card).filter(
      e => !existingEmails.some(ee => ee.address?.toLowerCase() === e.address.toLowerCase())
    );

    const newUrls = prepareUrlRecords(card).filter(
      u => !existingUrls.some(eu => eu.url?.toLowerCase() === u.url.toLowerCase())
    );

    const patchPayload: any = {
      phones: [...existingPhones, ...newPhones],
      emails: [...existingEmails, ...newEmails],
      urlAddresses: [...existingUrls, ...newUrls],
    };

    if (!existingDetails.company && card.business_name) {
      patchPayload.company = card.business_name;
    }
    if (!existingDetails.jobTitle && card.job_title) {
      patchPayload.jobTitle = card.job_title;
    }

    // Append card note
    const appendNote = `\n[Visiting Card Details]: ${card.business_name}${card.business_description ? ' - ' + card.business_description : ''}`;
    patchPayload.note = (existingDetails.note || '') + appendNote;

    await selectedContact.patch(patchPayload);

    const contactName = existingDetails.fullName || existingDetails.givenName || 'Selected Contact';
    return {
      success: true,
      contactName,
      message: `Updated "${contactName}" with visiting card details.`,
    };
  } catch (err: any) {
    console.error('Failed to add to existing contact:', err);
    return {
      success: false,
      message: err?.message || 'Could not update existing contact.',
    };
  }
}
