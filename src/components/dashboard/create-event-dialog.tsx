"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm, type UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ProgressDots } from "../ui/progress-dots";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Switch } from "../ui/switch";
import { Slider } from "../ui/slider";
import { Checkbox } from "../ui/checkbox";
import { blockContentCategories } from "@/lib/constants";
import { Label } from "@/components/ui/label";
import { nanoid } from "nanoid";
import { Card, CardContent } from "../ui/card";
import { CoverImageUpload } from "./cover-image-upload";
import { IMAGE_CONFIG } from "@/lib/image-utils";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/trpc/react";
import {
  type EventCreationFormValues,
  eventCreationSchema,
} from "@/lib/validations/event";
import { DateTimePicker } from "@/components/ui/date-time-picker";

interface CreateEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const totalSteps = 4;

export function CreateEventDialog({
  open,
  onOpenChange,
}: CreateEventDialogProps) {
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(0);

  const { toast } = useToast();
  const utils = api.useUtils();

  const form = useForm<EventCreationFormValues>({
    resolver: zodResolver(eventCreationSchema),
    mode: "onChange",
    defaultValues: {
      id: nanoid(),
      moderationSettings: {
        enabled: true,
        confidence: 70,
        categories: ["Explicit Nudity", "Violence", "Gore"],
      },
      name: "",
      description: "",
      coverImage: "",
      date: new Date(),
      endDate: new Date(),
    },
  });

  const createEvent = api.event.create.useMutation({
    onSuccess: () => {
      toast({
        title: "Event created!",
        description: "Your event has been created successfully.",
      });
      void utils.event.getAll.invalidate();
      onOpenChange(false);
    },
  });

  const onSubmit = async (data: EventCreationFormValues) => {
    try {
      await createEvent.mutateAsync(data);
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to create event. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleBack = () => {
    setDirection(-1);
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleNext = async (e: React.FormEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    // Determine which fields to validate based on current step
    const fieldsToValidate = (() => {
      switch (step) {
        case 1:
          return ["name", "description"] as const;
        case 2:
          return ["coverImage"] as const;
        case 3:
          return ["date"] as const;
        case 4:
          return ["moderationSettings"] as const;
        default:
          return [] as const;
      }
    })();

    // Trigger validation for current step fields
    const stepValid = await form.trigger(fieldsToValidate);

    if (stepValid) {
      setDirection(1);
      setStep((prev) => Math.min(prev + 1, totalSteps));
    }
  };

  const isStepValid = (
    step: number,
    formState: UseFormReturn<EventCreationFormValues>["formState"],
  ) => {
    const { errors } = formState;

    switch (step) {
      case 1:
        // Name is required, description is optional
        return !errors.name;
      case 2:
        // Cover image is required
        return !errors.coverImage;
      case 3:
        // Date is required
        return !errors.date;
      case 4:
        // All moderation settings have default values, so always valid
        return true;
      default:
        return false;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[80vh] max-h-[80vh] flex-col overflow-hidden sm:max-w-[425px]">
        <DialogHeader className="flex-none">
          <DialogTitle className="mb-4 text-center">Create Event</DialogTitle>
          <ProgressDots currentStep={step} totalSteps={totalSteps} />
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-1 flex-col"
          >
            <div className="relative mb-4 flex-1 overflow-y-auto overflow-x-hidden">
              <AnimatePresence
                mode="popLayout"
                initial={false}
                custom={direction}
              >
                <motion.div
                  key={step}
                  custom={direction}
                  variants={{
                    enter: (direction) => ({
                      x: direction > 0 ? 200 : -200,
                      opacity: 0,
                    }),
                    center: {
                      zIndex: 1,
                      x: 0,
                      opacity: 1,
                    },
                    exit: (direction) => ({
                      zIndex: 0,
                      x: direction < 0 ? 200 : -200,
                      opacity: 0,
                    }),
                  }}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{
                    x: { type: "spring", stiffness: 300, damping: 30 },
                    opacity: { duration: 0.2 },
                  }}
                  className="absolute w-full px-1"
                >
                  {step === 1 && <CreateEventStep1 form={form} />}
                  {step === 2 && <CreateEventStep2 form={form} />}
                  {step === 3 && <CreateEventStep3 form={form} />}
                  {step === 4 && <CreateEventStep4 form={form} />}
                </motion.div>
              </AnimatePresence>

              {/* Add spacing for absolute positioned content */}
              <div className="h-[300px]" />
            </div>

            <div className="flex-none border-t bg-background pt-6">
              <div className="flex justify-center justify-between gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  disabled={step === 1}
                >
                  Back
                </Button>
                {step < totalSteps ? (
                  <Button
                    type="button"
                    onClick={(e) => handleNext(e)}
                    disabled={!isStepValid(step, form.formState)}
                  >
                    Next
                  </Button>
                ) : (
                  <Button type="submit" disabled={!form.formState.isValid}>
                    Create Event
                  </Button>
                )}
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function CreateEventStep1({
  form,
}: {
  form: UseFormReturn<EventCreationFormValues>;
}) {
  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-lg font-semibold">Let&apos;s create your event!</h2>
        <p className="text-sm text-muted-foreground">
          Start by entering your event name
        </p>
      </div>

      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Event Name</FormLabel>
            <FormControl>
              <Input placeholder="" {...field} />
            </FormControl>
            <FormDescription>
              This will be displayed to your guests
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Description (Optional)</FormLabel>
            <FormControl>
              <Textarea
                rows={6}
                placeholder="Tell your guests about the event..."
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}

function CreateEventStep2({
  form,
}: {
  form: UseFormReturn<EventCreationFormValues>;
}) {
  const handleCoverUpload = (imageUrl: string) => {
    form.setValue("coverImage", imageUrl, {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  const handleUploadError = (error: string) => {
    form.setError("coverImage", {
      type: "manual",
      message: error,
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-lg font-semibold">Add a cover photo</h2>
        <p className="text-sm text-muted-foreground">
          Choose a photo that represents your event
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <FormField
              control={form.control}
              name="coverImage"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <CoverImageUpload
                      eventId={form.getValues("id")}
                      onUploadComplete={handleCoverUpload}
                      onError={handleUploadError}
                      value={field.value}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-1 pt-4 text-xs text-muted-foreground">
              <p>Accepted file types: JPEG, PNG, WebP</p>
              <p>Maximum file size: {IMAGE_CONFIG.maxSizeMB}MB</p>
              <p>
                Dimensions: {IMAGE_CONFIG.minWidth}x{IMAGE_CONFIG.minHeight}px
                to {IMAGE_CONFIG.maxWidth}x{IMAGE_CONFIG.maxHeight}px
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function CreateEventStep3({
  form,
}: {
  form: UseFormReturn<EventCreationFormValues>;
}) {
  // Get one week from now for end date validation
  const getMaxEndDate = (startDate: Date) => {
    const maxDate = new Date(startDate);
    maxDate.setDate(maxDate.getDate() + 7);
    return maxDate;
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-lg font-semibold">When is your event?</h2>
        <p className="text-sm text-muted-foreground">
          Select the start and end date/time of your event
        </p>
      </div>

      <FormField
        control={form.control}
        name="date"
        render={({ field }) => (
          <FormItem className="flex flex-col">
            <FormLabel>Start Date & Time</FormLabel>
            <FormControl>
              <DateTimePicker
                date={field.value}
                setDate={(date) => {
                  field.onChange(date);

                  // If end date is not set or is before start date,
                  // automatically set it to 1 hour after start
                  const endDate = form.getValues("endDate");
                  if (date && (!endDate || endDate <= date)) {
                    const newEndDate = new Date(date);
                    newEndDate.setHours(date.getHours() + 1);
                    form.setValue("endDate", newEndDate, {
                      shouldValidate: true,
                    });
                  }
                }}
                placeholder="Select start date and time"
                disabledDates={(date) => date < new Date()}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="endDate"
        render={({ field }) => (
          <FormItem className="flex flex-col">
            <FormLabel>End Date & Time</FormLabel>
            <FormControl>
              <DateTimePicker
                date={field.value}
                setDate={field.onChange}
                placeholder="Select end date and time"
                disabledDates={(date) => {
                  const startDate = form.getValues("date");
                  if (!startDate) return date < new Date();

                  // End date must be same day or after start date
                  // And within one week of start date
                  return date < startDate || date > getMaxEndDate(startDate);
                }}
              />
            </FormControl>
            <FormDescription>
              Must be after the start date and within one week
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}

function CreateEventStep4({
  form,
}: {
  form: UseFormReturn<EventCreationFormValues>;
}) {
  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-lg font-semibold">Content Moderation</h2>
        <p className="text-sm text-muted-foreground">
          Choose how you want to moderate uploaded photos
        </p>
      </div>

      <FormField
        control={form.control}
        name="moderationSettings.enabled"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FormLabel className="text-base">
                Enable Content Moderation
              </FormLabel>
              <FormDescription>
                Automatically check photos for inappropriate content
              </FormDescription>
            </div>
            <FormControl>
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="moderationSettings.categories"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Block Content Categories</FormLabel>
            <FormControl>
              <div className="grid gap-2">
                {blockContentCategories.map((category) => (
                  <div key={category} className="flex items-center space-x-2">
                    <Checkbox
                      id={category}
                      checked={field.value?.includes(category)}
                      onCheckedChange={(checked) => {
                        const newValue = checked
                          ? [...field.value, category]
                          : field.value?.filter((v) => v !== category);
                        field.onChange(newValue);
                      }}
                    />
                    <Label htmlFor={category}>{category}</Label>
                  </div>
                ))}
              </div>
            </FormControl>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="moderationSettings.confidence"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Confidence Threshold</FormLabel>
            <FormControl>
              <Slider
                value={[field.value]}
                onValueChange={(value) => field.onChange(value[0])}
                max={100}
                step={1}
              />
            </FormControl>
            <FormDescription>
              Higher values mean stricter moderation. We recommend 70%.
            </FormDescription>
          </FormItem>
        )}
      />
    </div>
  );
}
