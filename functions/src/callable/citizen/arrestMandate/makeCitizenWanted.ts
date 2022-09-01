import * as functions from 'firebase-functions';
import * as utils from '../../../utils';
import * as modelsUtil from '../../../utils/models';
import { Unauthenticated } from '../../../utils/errors';
import ICrime from '../../../models/crime.interface';
import { makeRegistration } from '../../../registry/makeRegistration';
import ICitizen from '../../../models/citizen.interface';
import IOfficer from '../../../models/officer.interface';

export interface IMakeCitizenWantedProps {
    citizenId: string;
    crimesIds: string[];
    author: string;
}

export const makeCitizenWantedCall = functions.https.onCall(
    async (data: IMakeCitizenWantedProps, context: functions.https.CallableContext) => {
        if (!context.auth?.uid) {
            throw Unauthenticated();
        }

        const error =
            (await utils.requirePermissions(context.auth?.uid, ['setCitizenPhoneNumber'])) ||
            (await utils.requireValidated(data, {
                citizenId: {
                    validFirebaseId: 'citizens',
                },
                author: {
                    presence: true,
                    type: 'string',
                },
                crimesIds: {
                    type: 'array',
                    validFirebaseIds: 'crimes',
                },
            }));

        if (error) {
            throw error;
        }
        /* ******************************************************************* */
        const citizenDoc = await modelsUtil.readCitizen(data.citizenId);

        const crimes: ICrime[] = [];
        for (const crimeId of data.crimesIds) {
            const crime = await modelsUtil.readCrime(crimeId);
            crimes.push({
                ...(crime.data() as ICrime),
                Id: crime.id,
            });
        }

        const summaryCrimes: string[] = data.crimesIds;
        if (citizenDoc.data()?.IsWanted && citizenDoc.data()?.WantedCrimesIds) {
            summaryCrimes.push(...(citizenDoc.data()?.WantedCrimesIds as string[]));
        }

        await citizenDoc.ref.update({
            IsWanted: true,
            WantedCrimesIds: summaryCrimes,
        });

        /* ******************************************************************* */
        const officerDoc = await modelsUtil.readOfficer(context.auth.uid);
        await makeRegistration(
            {
                Citizen: {
                    ...(citizenDoc.data() as ICitizen),
                    Id: citizenDoc.id,
                },
                OfficerAuthor: {
                    ...(officerDoc.data() as IOfficer),
                    Id: officerDoc.id,
                },
                Prefixes: [
                    {
                        Id: '',
                        Content: ':spy:',
                        Description: 'wanted',
                    },
                ],
                Title: 'newWanted',
                Description: data.author,
                Crimes: crimes,
                ImageUrl: citizenDoc.get('ImageUrl'),
            },
            {
                channel: 'wanted',
                title: 'WANTED',
                customMessage: (msg) =>
                    msg
                        .addField('Reason', crimes.map((c) => c.Name).join(', '))
                        .addField(
                            'Penalty',
                            crimes
                                .map((c) => +c.Penalty)
                                .reduce((prev, curr) => prev + curr, 0)
                                .toString()
                        )
                        .addField(
                            'Judgment',
                            crimes
                                .map((c) => +c.Judgment)
                                .reduce((prev, curr) => prev + curr, 0)
                                .toString()
                        ),
            }
        );

        return 1;
    }
);
