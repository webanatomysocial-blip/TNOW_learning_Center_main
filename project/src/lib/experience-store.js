import { create } from "zustand";
import { persist } from "zustand/middleware";

// Relative step definitions — each `path` is relative to `/experience/:productSlug`.
// Consumers build absolute links via `getSteps(productSlug)` or by prepending
// `/experience/${productSlug}/` themselves.
const STEP_DEFS = [
  { id: "welcome", label: "Welcome", path: "" },
  { id: "why", label: "Why", path: "why" },
  { id: "tour", label: "Product Tour", path: "tour" },
  { id: "stories", label: "Customer Stories", path: "stories" },
  { id: "ai", label: "AI Expert", path: "ai" },
  { id: "book", label: "Book Workshop", path: "book" },
];

export function getSteps(productSlug) {
  const base = `/experience/${productSlug}`;
  return STEP_DEFS.map((s) => ({
    ...s,
    path: s.path ? `${base}/${s.path}` : base,
  }));
}

// Backward-compatible default STEPS built against a placeholder slug is not safe,
// so STEPS is kept as the relative definitions for anything that only needs id/label,
// and getSteps(productSlug) should be used wherever absolute links are required.
export const STEPS = STEP_DEFS;

export const useExperience = create()(
  persist(
    (set, get) => ({
      user: null,
      // Set right after a successful magic-link consume — lets the running session
      // report progress back to the specific invite record it came from (see
      // reportProgress in ExperienceLayout), so the admin can see how far a
      // customer got without them ever needing to click the link again.
      inviteId: null,
      completed: {
        welcome: false,
        why: false,
        tour: false,
        stories: false,
        ai: false,
        book: false,
      },
      capabilitiesViewed: [],
      storiesRead: [],
      aiQuestionsAsked: 0,
      videosWatched: 0,
      achievements: [],
      assessmentScore: null,
      assessmentAnswers: [],
      // Transient UI state (not persisted, see partialize below) — lets the AI
      // chat button live in StepNav's footer while the drawer itself is still
      // rendered once by ExperienceLayout.
      aiOpen: false,
      setAiOpen: (aiOpen) => set({ aiOpen }),
      setUser: (user) => set({ user }),
      setInviteId: (inviteId) => set({ inviteId }),
      setAssessmentResult: (score, answers) =>
        set({ assessmentScore: score, assessmentAnswers: answers }),
      resetAssessment: () => set({ assessmentScore: null, assessmentAnswers: [] }),
      complete: (id) =>
        set((s) => {
          if (id === "tour") {
            const allDone = s.capabilitiesViewed.length === 6;
            return {
              completed: {
                ...s.completed,
                tour: allDone,
              },
            };
          }
          return { completed: { ...s.completed, [id]: true } };
        }),
      markCapability: (id) =>
        set((s) => {
          const nextViewed = s.capabilitiesViewed.includes(id)
            ? s.capabilitiesViewed
            : [...s.capabilitiesViewed, id];
          const isTourDone = nextViewed.length === 6;
          return {
            capabilitiesViewed: nextViewed,
            completed: {
              ...s.completed,
              tour: isTourDone,
            },
          };
        }),
      markStory: (id) =>
        set((s) => ({
          storiesRead: s.storiesRead.includes(id) ? s.storiesRead : [...s.storiesRead, id],
        })),
      incAi: () => set((s) => ({ aiQuestionsAsked: s.aiQuestionsAsked + 1 })),
      // Fires once a video actually plays to the end (not just on open/click) — see
      // listenForVideoEnd in video-embed.js. Distinct from markCapability, which is the
      // "viewed" flag driven by that same finish event.
      incVideos: () => set((s) => ({ videosWatched: s.videosWatched + 1 })),
      addAchievement: (a) =>
        set((s) => ({
          achievements: s.achievements.includes(a) ? s.achievements : [...s.achievements, a],
        })),
      reset: () =>
        set({
          user: null,
          inviteId: null,
          completed: {
            welcome: false,
            why: false,
            tour: false,
            stories: false,
            ai: false,
            book: false,
          },
          capabilitiesViewed: [],
          storiesRead: [],
          aiQuestionsAsked: 0,
          videosWatched: 0,
          achievements: [],
          assessmentScore: null,
          assessmentAnswers: [],
        }),
    }),
    {
      name: "togglenow-experience",
      partialize: (state) => {
        const { aiOpen, ...rest } = state;
        return rest;
      },
    },
  ),
);

export function useProgress(pathname) {
  const completed = useExperience((s) => s.completed);
  const total = STEPS.length;

  const done = STEPS.filter((s) => completed[s.id]).length;
  return { done, total, pct: Math.round((done / total) * 100) };
}
