// tslint:disable-next-line: no-shadowed-variable
type ElementType<T extends ReadonlyArray<unknown>> = T extends ReadonlyArray<infer ElementType>
    ? ElementType
    : never;

export const AllPermissions = [
    // Drawer
    'accessSummary', // Tab visibility: Summary
    'accessCitizens', // Tab visibility: Citizens
    'accessVehicles', // Tab visibility: Vehicles
    'accessPolice', // Tab visibility: Police
    'accessCrimes', // Tab visibility: Crimes
    'accessPrefixes', // Tab visibility: Prefixes
    'accessRanks', // Tab visibility: Ranks

    // Citizen details
    'setCitizenPhoneNumber', // Option visibility: Set Citizen Phone Number
    'makeCitizenRegistration', // Option visibility: Make Citizen Registration
    'accessArrestMandate', // Option visibility: Arrest | Mandate
    'recruitOfficer', // Option visibility: Recruit
    'setCitizenPhoto', // Ability to Ctrl+V image

    // Police
    'changeOfficerBadgeNumber', // Button visibility: Badge Number
    'changeOfficerRank', // Button visibility: Change rank
    'fireOfficer', // Button visibility: Fire (delete officer)

    // Crimes
    'manageCrimes', // Buttons visibility: Add, Edit and Delete

    // Prefixes
    'managePrefixes', // Buttons visibility: Add, Edit and Delete

    // Ranks
    'manageRanks', // Buttons visibility: Add, Edit and Delete
];

export default interface IUserClaims {
    admin?: boolean;
    permissions?: ElementType<typeof AllPermissions>;
}
