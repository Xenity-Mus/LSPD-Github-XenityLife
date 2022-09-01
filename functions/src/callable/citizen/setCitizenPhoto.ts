import * as functions from 'firebase-functions';
import * as utils from '../../utils';
import * as modelsUtil from '../../utils/models';
import { Unauthenticated } from '../../utils/errors';
import { makeRegistration } from '../../registry/makeRegistration';
import ICitizen from '../../models/citizen.interface';
import IOfficer from '../../models/officer.interface';

export interface ISetCitizenPhotoProps {
    citizenId: string;
    imageUrl: string;
}

export const setCitizenPhotoCall = functions.https.onCall(
    async (data: ISetCitizenPhotoProps, context: functions.https.CallableContext) => {
        if (!context.auth?.uid) {
            throw Unauthenticated();
        }

        const error =
            (await utils.requirePermissions(context.auth?.uid, ['setCitizenPhoto'])) ||
            (await utils.requireValidated(
                {
                    citizen: { Id: data.citizenId, ImageUrl: data.imageUrl },
                },
                {
                    citizen: {
                        ModelCitizen: ['Id', 'ImageUrl'],
                    },
                }
            ));

        if (error) {
            throw error;
        }
        /* ******************************************************************* */
        const citizenDoc = await modelsUtil.readCitizen(data.citizenId);

        await citizenDoc.ref.update('ImageUrl', data.imageUrl);

        if (citizenDoc.data()?.IsOfficer) {
            const officerCitizenDoc = await modelsUtil
                .readOfficerByCitizenId(data.citizenId)
                .catch(() => null);

            if (officerCitizenDoc && officerCitizenDoc.exists) {
                await officerCitizenDoc.ref.update('Citizen.ImageUrl', data.imageUrl);
            }
        }
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
                        Content: ':frame_photo:',
                        Description: 'photoChange',
                    },
                ],
                Title: 'photoChange',
                ImageUrl: data.imageUrl,
            },
            {
                channel: 'registry',
                title: 'Photo change',
            }
        );

        return 1;
    }
);
