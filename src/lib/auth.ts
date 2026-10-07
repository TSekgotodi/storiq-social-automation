import { createClient, SupabaseClient, type User } from "@supabase/supabase-js";
import { projectId, publicAnonKey } from "../../utils/supabase/info";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? `https://${projectId}.supabase.co`;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? publicAnonKey;
const existingClient: unknown = import.meta.hot?.data.authClient;

export const authClient = existingClient instanceof SupabaseClient
  ? existingClient
  : createClient(
  supabaseUrl,
  supabaseKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
);

if (import.meta.hot) {
  import.meta.hot.dispose((data) => {
    data.authClient = authClient;
  });
}

export function consumeSocialLoginError(): string | null {
  const url = new URL(window.location.href);
  const hash = new URLSearchParams(url.hash.slice(1));
  const error = url.searchParams.get("error") ?? hash.get("error");
  if (!error) return null;
  for (const key of ["error", "error_code", "error_description"]) {
    url.searchParams.delete(key);
    hash.delete(key);
  }
  url.hash = hash.toString();
  window.history.replaceState(window.history.state, "", url);
  return error === "access_denied"
    ? "Social sign-in was cancelled or denied. Try again or sign in with email."
    : "Social sign-in could not be completed. Try again or sign in with email.";
}

export async function signInWithSocialProvider(
  provider: "google" | "facebook",
) {
  if (!supabaseKey || supabaseKey === "******") {
    throw new Error(
      "Social sign-in is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY and enable Google and Facebook in Supabase.",
    );
  }
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch(`${supabaseUrl.replace(/\/$/, "")}/auth/v1/settings`, {
      headers: { apikey: supabaseKey },
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error("Could not verify social sign-in configuration. Please try email sign-in.");
    }
    const settings: unknown = await response.json();
    if (!isRecord(settings) || !isRecord(settings.external)) {
      throw new Error("The social sign-in service returned invalid configuration.");
    }
    if (settings.external[provider] !== true) {
      throw new Error(
        `${provider === "google" ? "Google" : "Facebook"} sign-in is not enabled. Please sign in with email or contact your administrator.`,
      );
    }
  } catch (error) {
    if (error instanceof TypeError || controller.signal.aborted) {
      throw new Error("Could not reach the social sign-in service. Try again or sign in with email.");
    }
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
  const { data, error } = await authClient.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${window.location.origin}${window.location.pathname}`,
      skipBrowserRedirect: true,
    },
  });

  if (error) throw error;
  if (!data.url) {
    throw new Error("The account service did not provide a social sign-in URL.");
  }
  const destination = new URL(data.url);
  if (destination.origin !== new URL(supabaseUrl).origin) {
    throw new Error("The account service returned an unexpected social sign-in URL.");
  }
  window.location.assign(destination.toString());
}

export interface BackendAuthPayload {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  role: number;
}

export interface UserProfile {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  role: number | null;
  profileImage: string | null;
}

export interface BackendSession {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
  user: UserProfile;
}

export function getPlanLabel(role: number | null): string {
  switch (role) {
    case 1:
      return "Basic plan";
    case 2:
      return "Standard plan";
    case 3:
      return "Premium plan";
    default:
      return "Plan unavailable";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function getSocialUserProfile(user: User): UserProfile {
  const metadata = isRecord(user.user_metadata) ? user.user_metadata : {};
  const name = typeof metadata.full_name === "string"
    ? metadata.full_name
    : typeof metadata.name === "string" ? metadata.name : "";
  const fullName = name
    ? name.trim().split(/\s+/)
    : [];
  return {
    userId: user.id,
    email: user.email ?? "",
    firstName: typeof metadata.given_name === "string"
      ? metadata.given_name : fullName[0] ?? "",
    lastName: typeof metadata.family_name === "string"
      ? metadata.family_name : fullName.slice(1).join(" "),
    phoneNumber: user.phone ?? "",
    role: null,
    profileImage: typeof metadata.avatar_url === "string"
      ? metadata.avatar_url
      : typeof metadata.picture === "string" ? metadata.picture : null,
  };
}

const DEFAULT_REGISTER_ENDPOINT =
  "https://useridentityapi-production.up.railway.app/api/v1/auth/register";

export async function registerWithBackend(payload: BackendAuthPayload) {
  const endpoint =
    import.meta.env.VITE_AUTH_REGISTER_URL ?? DEFAULT_REGISTER_ENDPOINT;
  return requestBackendAuth(endpoint, payload, "Registration");
}

export async function loginWithBackend(
  payload: Pick<BackendAuthPayload, "email" | "password">,
): Promise<BackendSession> {
  const endpoint =
    import.meta.env.VITE_AUTH_LOGIN_URL ??
    "https://useridentityapi-production.up.railway.app/api/v1/auth/login";
  const response = await requestBackendAuth(endpoint, payload, "Sign-in");
  if (!isRecord(response) || response.success !== true || !isRecord(response.data)) {
    throw new Error("The account service did not return a successful login session.");
  }
  const data = response.data;
  const user = data.user;
  if (
    typeof data.accessToken !== "string" || !data.accessToken ||
    typeof data.refreshToken !== "string" || !data.refreshToken ||
    typeof data.expiresIn !== "number" || !Number.isFinite(data.expiresIn) ||
    data.expiresIn <= 0 ||
    typeof data.tokenType !== "string" || !data.tokenType ||
    !isRecord(user) ||
    typeof user.userId !== "string" || !user.userId ||
    typeof user.email !== "string" || !user.email ||
    typeof user.firstName !== "string" ||
    typeof user.lastName !== "string" ||
    typeof user.phoneNumber !== "string" ||
    typeof user.role !== "number" || !Number.isInteger(user.role) ||
    !(user.profileImage === null || typeof user.profileImage === "string")
  ) {
    throw new Error("The account service returned an invalid login session or user profile.");
  }
  return {
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    expiresIn: data.expiresIn,
    tokenType: data.tokenType,
    user: {
      userId: user.userId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phoneNumber: user.phoneNumber,
      role: user.role,
      profileImage: user.profileImage,
    },
  };
}

async function requestBackendAuth(
  endpoint: string,
  payload: BackendAuthPayload | Pick<BackendAuthPayload, "email" | "password">,
  action: string,
) {
  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(
        "Could not reach the account service. Check your connection and try again.",
      );
    }
    throw error;
  }

  const responseText = await response.text();
  let responseData: unknown;

  if (responseText) {
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = responseText;
    }
  }

  if (!response.ok) {
    const detail =
      typeof responseData === "object" &&
      responseData !== null &&
      "message" in responseData
        ? String(responseData.message)
        : `${action} failed with HTTP ${response.status}.`;
    throw new Error(detail);
  }

  if (isRecord(responseData) && responseData.success === false) {
    throw new Error(
      typeof responseData.message === "string" && responseData.message
        ? responseData.message : `${action} was rejected by the account service.`,
    );
  }

  return responseData;
}
