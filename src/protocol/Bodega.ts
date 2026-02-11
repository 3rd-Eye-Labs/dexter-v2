import axios from 'axios';

export class Bodega {

    constructor(
        protected irisHost: string,
    ) {}

    markets() {
        return axios.get(`${this.irisHost}/api/bodega/markets`)
            .then((response: any) => response.data)
            .catch(() => {
                return Promise.resolve(false);
            });
    }

    marketHistory(marketId: string) {
        return axios.get(`${this.irisHost}/api/bodega/markets/${marketId}/history`)
            .then((response: any) => response.data)
            .catch(() => {
                return Promise.resolve(false);
            });
    }
}