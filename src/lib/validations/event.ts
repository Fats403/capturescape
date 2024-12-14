import { z } from "zod";
import { nanoid } from "nanoid";
import { blockContentCategories } from "../constants";

export const eventSchema = z.object({
  id: z.string().default(() => nanoid()),
  name: z.string().max(100).min(1, "Event name is required"),
  description: z.string().max(350).optional(),
  date: z.date({
    required_error: "Event date is required",
  }),
  coverImage: z.string().min(1, "Cover image is required"),
  moderationSettings: z.object({
    enabled: z.boolean().default(true),
    confidence: z.number().min(0).max(100).default(70),
    categories: z
      .array(z.enum(blockContentCategories))
      .default(["Explicit Nudity", "Violence", "Gore"]),
  }),
});

export type EventFormValues = z.infer<typeof eventSchema>;
