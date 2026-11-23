declare global {
    namespace NodeJS {
        interface ProcessEnv {
            PORT?: string;
            DB_NAME?: string;
            DB_USER?: string;
            DB_PASSWORD?: string;
            DB_HOST?: string;
            DB_PORT?: string;
            SECRET_KEY_ROLE?: string;
            API_URL?: string;
            CLIENT_URL?: string;
            GOOGLE_CLIENT_ID?: string;
            SF_CLIENT_ID?: string;
            SF_CLIENT_SECRET?: string;
            DROPBOX_ACCESS_TOKEN?: string;
        }
    }
}

export {};
