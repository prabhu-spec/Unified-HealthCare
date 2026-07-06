import axios from "axios";

export class FhirClient {
  constructor(
    private baseUrl: string,
    private token?: string
  ) {}

  async get(resource: string, id?: string) {
    return axios.get(
      `${this.baseUrl}/${resource}${id ? "/" + id : ""}`,
      { headers: this.headers() }
    );
  }

  async search(resource: string, params: any) {
    return axios.get(
      `${this.baseUrl}/${resource}`,
      { params, headers: this.headers() }
    );
  }

  async create(resource: string, body: any) {
    return axios.post(
      `${this.baseUrl}/${resource}`,
      body,
      { headers: this.headers() }
    );
  }

  private headers() {
    return this.token
      ? { Authorization: `Bearer ${this.token}` }
      : {};
  }
}
