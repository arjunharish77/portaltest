function getEnv(name: string, value: string | undefined, required = true): string {
    if (!value) {
        if (required) throw new Error(`Missing environment variable: ${name}`)
        return ''
    }
    return value
}

export const env = {
    NEXT_PUBLIC_SUPABASE_URL: getEnv('NEXT_PUBLIC_SUPABASE_URL', process.env.NEXT_PUBLIC_SUPABASE_URL),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    SUPABASE_SERVICE_ROLE_KEY: getEnv('SUPABASE_SERVICE_ROLE_KEY', process.env.SUPABASE_SERVICE_ROLE_KEY),
    APP_ENV: getEnv('APP_ENV', process.env.APP_ENV),
    SMS_API_BASE_URL: getEnv('SMS_API_BASE_URL', process.env.SMS_API_BASE_URL),
    SMS_API_USERNAME: getEnv('SMS_API_USERNAME', process.env.SMS_API_USERNAME),
    SMS_API_PASSWORD: getEnv('SMS_API_PASSWORD', process.env.SMS_API_PASSWORD),
    SMS_API_FROM: getEnv('SMS_API_FROM', process.env.SMS_API_FROM),
}

export const isDev = () => process.env.APP_ENV === 'development'