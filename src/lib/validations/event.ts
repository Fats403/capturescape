import { z } from "zod";
import { blockContentCategories } from "../constants";
import { addDays } from "date-fns";

export const eventCreationSchema = z
  .object({
    id: z.string(),
    name: z.string().max(100).min(1, "Event name is required"),
    description: z.string().max(350).optional(),
    date: z.date({
      required_error: "Event start date is required",
    }),
    endDate: z.date({
      required_error: "Event end date is required",
    }),
    coverImage: z.string().min(1, "Cover image is required"),
    moderationSettings: z.object({
      enabled: z.boolean().default(true),
      confidence: z.number().min(0).max(100).default(70),
      categories: z
        .array(z.enum(blockContentCategories))
        .default(["Explicit Nudity", "Violence", "Gore"]),
    }),
  })
  .refine(
    (data) => {
      // Validate that end date is after start date
      if (data.date && data.endDate) {
        const startDate = new Date(data.date);
        const endDate = new Date(data.endDate);

        // End date must be after start date
        if (endDate <= startDate) {
          return false;
        }

        // End date must be within one week of start date
        const maxEndDate = addDays(startDate, 7);
        return endDate <= maxEndDate;
      }
      return true;
    },
    {
      message: "End date must be after start date and within one week",
      path: ["endDate"],
    },
  );

export type EventCreationFormValues = z.infer<typeof eventCreationSchema>;
