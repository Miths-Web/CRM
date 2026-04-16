export interface CustomerMaster {
    id: string;
    companyId?: string;
    companyName?: string;
    firstName: string;
    lastName: string;
    email?: string;
    phoneNo?: string;
    aadharCardNo?: string;
    panNumber?: string;
    gstNo?: string;
    designation?: string;
    department?: string;
    createdBy?: string;
    createdByUserName?: string;
    assignedToUserId?: string;
    assignedToUserName?: string;
    updatedBy?: string;
    updatedByUserName?: string;
    createdDate: string;
    updatedDate: string;
    addresses?: CustomerAddress[];
}

export interface CustomerAddress {
    id: string;
    customerId: string;
    addressType: string; // 'Billing' | 'Shipping' | 'Office'
    street1: string;
    street2?: string;
    city: string;
    state: string;
    zipCode?: string;
    country: string;
    isDefault: boolean;
}
