import { parentPort, workerData } from 'worker_threads';
import { PaymentsRequest } from '../model/payments.request';
import { DIContainer } from '../../di-container';

async function processTask(data: PaymentsRequest) {
    const result = await (DIContainer.resolve('paymentsService')).processTask(data);
    parentPort?.postMessage(result);
}

processTask(workerData);