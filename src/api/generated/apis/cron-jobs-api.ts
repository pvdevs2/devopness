/* eslint-disable */
/**
 * devopness API
 * Devopness API - Painless essential DevOps to everyone 
 *
 * The version of the OpenAPI document: latest
 * 
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

import { ApiBaseService } from "../../../services/ApiBaseService";
import { ApiResponse } from "../../../common/ApiResponse";
import { ArgumentNullException } from "../../../common/Exceptions";
import { CronJob } from '../../generated/models';

/**
 * CronJobsApiService - Auto-generated
 */
export class CronJobsApiService extends ApiBaseService {
    /**
     * 
     * @summary Delete a given CronJob
     * @param {number} taskId Numeric ID of the cron job to be deleted
     */
    public async deleteCronJob(taskId: number): Promise<ApiResponse<void>> {
        if (taskId === null || taskId === undefined) {
            throw new ArgumentNullException('taskId', 'deleteCronJob');
        }
        const response = await this.delete <void>(`/tasks/{task_id}`.replace(`{${"task_id"}}`, encodeURIComponent(String(taskId))));
        return new ApiResponse(response);
    }

    /**
     * 
     * @summary Get a CronJob by ID
     * @param {number} taskId Numeric ID of the cron job to get
     */
    public async getCronJob(taskId: number): Promise<ApiResponse<CronJob>> {
        if (taskId === null || taskId === undefined) {
            throw new ArgumentNullException('taskId', 'getCronJob');
        }
        const response = await this.get <CronJob>(`/tasks/{task_id}`.replace(`{${"task_id"}}`, encodeURIComponent(String(taskId))));
        return new ApiResponse(response);
    }
}
