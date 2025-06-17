import { z } from "zod"

export const voteSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  turnstileToken: z.string().min(1, "Please complete the verification"),
})

export const adminLoginSchema = z.object({
  password: z.string().min(1, "Password is required"),
})

export type VoteFormData = z.infer<typeof voteSchema>
export type AdminLoginFormData = z.infer<typeof adminLoginSchema>
