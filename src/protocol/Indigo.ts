import axios from 'axios';

export class Indigo {

    constructor(
        protected irisHost: string,
    ) {}

    cdps() {
        return axios.get(`${this.irisHost}/api/indigo/cdps`)
            .then((response: any) => response.data)
            .catch(() => {
                return Promise.resolve(false);
            });
    }

    stakingPositions() {
        return axios.get(`${this.irisHost}/api/indigo/staking/positions`)
            .then((response: any) => response.data)
            .catch(() => {
                return Promise.resolve(false);
            });
    }

}