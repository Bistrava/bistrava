/** Public company details and returns address confirmed by the store operator. */
export const companyDetails = {
  fullName: "PUREH2O, razvojni inženiring, d.o.o.",
  shortName: "PUREH2O d.o.o.",
  legalForm: "družba z omejeno odgovornostjo (d.o.o.)",
  registrationNumber: "8583056000",
  registrationDate: "2020-01-14",
  registrationDateSl: "14. januar 2020",
  registrationAuthority: "Okrožno sodišče Novo mesto",
  legalRepresentative: "Erika Kozjan",
  taxNumber: "12238147",
  vatNumber: "SI12238147",
  email: "kontakt@bistrava.com",
  phone: "+386 40 634 639",
  phoneHref: "tel:+38640634639",
  registeredOffice: {
    streetAddress: "Srebrniče 18A",
    postalCode: "8000",
    addressLocality: "Novo mesto",
    addressCountry: "SI",
    countryName: "Slovenija",
  },
  returnsAddress: {
    streetAddress: "Srebrniče 18A",
    postalCode: "8000",
    addressLocality: "Novo mesto",
    addressCountry: "SI",
    countryName: "Slovenija",
  },
} as const;

export const companyPostalAddress = `${companyDetails.registeredOffice.streetAddress}, ${companyDetails.registeredOffice.postalCode} ${companyDetails.registeredOffice.addressLocality}, ${companyDetails.registeredOffice.countryName}`;
export const companyReturnsAddress = `${companyDetails.returnsAddress.streetAddress}, ${companyDetails.returnsAddress.postalCode} ${companyDetails.returnsAddress.addressLocality}, ${companyDetails.returnsAddress.countryName}`;
export const irpsStatement = `${companyDetails.shortName} ne priznava nobenega izvajalca izvensodnega reševanja potrošniških sporov (IRPS) kot pristojnega za reševanje potrošniških sporov v skladu z ZIsRPS.`;
