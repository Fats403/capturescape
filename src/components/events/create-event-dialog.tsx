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
import { Calendar } from "../ui/calendar";
import { Switch } from "../ui/switch";
import { Slider } from "../ui/slider";
import { Checkbox } from "../ui/checkbox";
import { blockContentCategories } from "@/lib/constants";
import { Label } from "@/components/ui/label";
import { DelayedMount } from "@/components/ui/delayed-mount";
import { eventSchema, type EventFormValues } from "@/lib/validations/event";
import { nanoid } from "nanoid";
import { Card, CardContent } from "../ui/card";
import { CoverImageUpload } from "./cover-image-upload";
import { IMAGE_CONFIG } from "@/lib/image-utils";

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

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    mode: "onChange",
    defaultValues: {
      id: nanoid(), // this might be getting reset..
      moderationSettings: {
        enabled: true,
        confidence: 70,
        categories: ["Explicit Nudity", "Violence", "Gore"],
      },
      name: "",
      description: "",
      coverImage: "",
    },
  });

  const onSubmit = async (data: EventFormValues) => {
    try {
      // Submit event data
      onOpenChange(false);
    } catch (error) {
      // Handle error
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
    formState: UseFormReturn<EventFormValues>["formState"],
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

function CreateEventStep1({ form }: { form: UseFormReturn<EventFormValues> }) {
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
              <Input placeholder="Summer Wedding 2024" {...field} />
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

function CreateEventStep2({ form }: { form: UseFormReturn<EventFormValues> }) {
  const [error, setError] = useState<string | null>(null);

  const handleCoverUpload = (imageUrl: string) => {
    setError(null);
    form.setValue("coverImage", imageUrl, {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  const handleUploadError = (error: string) => {
    setError(error);
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

            <div className="mt-2 space-y-1 text-xs text-muted-foreground">
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

      {error && <div className="text-sm text-destructive">{error}</div>}
    </div>
  );
}

function CreateEventStep3({ form }: { form: UseFormReturn<EventFormValues> }) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-lg font-semibold">When is your event?</h2>
        <p className="text-sm text-muted-foreground">
          Select the date of your event
        </p>
      </div>

      <FormField
        control={form.control}
        name="date"
        render={({ field }) => (
          <FormItem className="flex flex-col">
            <FormControl>
              <div className="mx-auto">
                <DelayedMount delay={100}>
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) => date < new Date()}
                    initialFocus
                    className="rounded-md border"
                  />
                </DelayedMount>
              </div>
            </FormControl>
            <FormMessage className="pt-4 text-center" />
          </FormItem>
        )}
      />
    </div>
  );
}

function CreateEventStep4({ form }: { form: UseFormReturn<EventFormValues> }) {
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
