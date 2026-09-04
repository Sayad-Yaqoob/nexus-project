/** Browser-safe backend API base URL, configurable per deployment. */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1";

export const apiUrl = (path: string) => `${API_BASE_URL}${path}`;

let accessToken: string | null = null;

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && init.body && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);

  const response = await fetch(apiUrl(path), { ...init, headers });
  const body = await response.json();
  if (!response.ok) throw new Error(body.detail || "NEXUS API request failed");
  return body as T;
}

/** Compatibility client for the earlier onboarding/dashboard surfaces. */
export const api = {
  setToken(token: string | null) {
    accessToken = token;
  },
  getHealth: (): Promise<any> => request("/health"),
  demoLogin: (uid: number | string): Promise<any> => request("/auth/verify", {
    method: "POST",
    body: JSON.stringify({ uid: String(uid) }),
  }),
  getUserMe: (): Promise<any> => request("/users/me"),
  async addOffering(_expertId: number | string, rawDescription: string): Promise<any> {
    const draft: any = await request("/expert/generate-offering", {
      method: "POST", body: JSON.stringify({ raw_description: rawDescription }),
    });
    return request("/expert/publish-offering", {
      method: "POST",
      body: JSON.stringify({
        title: draft.title, offer_type: draft.offer_type, price: draft.price,
        duration: draft.duration, description: draft.description,
      }),
    });
  },
  async describeExpert(rawDescription: string, userId: number | string): Promise<any> {
    const profile: any = await request("/expert/generate-profile", {
      method: "POST", body: JSON.stringify({ raw_description: rawDescription, user_id: String(userId) }),
    });
    return {
      status: "preview_ready",
      preview: {
        draft_id: "generated", user_id: Number(userId), full_name: "MindGigs Expert",
        professional_headline: profile.headline, bio: profile.bio, category: profile.category,
        expertise_tags: profile.tags, offerings: [], is_verified: false, needs_file_upload: false,
      },
    };
  },
  approveDraft: (_draftId: string): Promise<any> => Promise.resolve({ status: "success" }),
  async describeClientProblem(rawProblem: string): Promise<any> {
    const result: any = await request("/client/find-experts", {
      method: "POST", body: JSON.stringify({ raw_problem: rawProblem }),
    });
    return { status: "completed", matches: { matches: result.matches || [] }, session_id: null };
  },
  answerClientQuestion: (_sessionId: number, answer: string): Promise<any> => api.describeClientProblem(answer),
};
