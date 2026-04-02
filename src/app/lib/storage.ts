export default class Storage {

    private static PA_SESSION_TOKEN: string = "PA_SESSION_TOKEN";

    public static getSessionToken(): string {
        return localStorage.getItem(this.PA_SESSION_TOKEN) || "";
    }

    public static setSessionToken(token: string) {
        localStorage.setItem(this.PA_SESSION_TOKEN, token);
    }
}