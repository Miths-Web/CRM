export interface CompanyMaster {
    id: string;
    companyName: string;
    companyAddress?: string;
    ownerFirstName?: string;
    ownerLastName?: string;
    email?: string;
    phoneNo?: string;
    gstNo?: string;
    panNumber?: string;
    logoUrl?: string;
    createdDate: string;
    updatedDate: string;
}

export interface CustomerParams {
    pageNumber: number;
    pageSize: number;
    search?: string;
}
