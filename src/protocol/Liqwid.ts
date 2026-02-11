import axios from 'axios';

export class Liqwid {

    constructor(
        protected irisHost: string,
    ) {}

    marketParameters() {
        return axios.get(`${this.irisHost}/api/liqwid/markets/parameters`)
            .then((response: any) => response.data)
            .catch(() => {
                return Promise.resolve(false);
            });
    }

}