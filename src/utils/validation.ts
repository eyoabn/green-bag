import { z } from "zod";

export const LoginSchema = z.object({
  email: z.string().email("Invalid email address format."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

export const SignupSchema = z.object({
  email: z.string().email("Invalid email address format."),
  password: z.string().min(6, "Password must be at least 6 characters."),
  fullName: z.string().min(2, "Full name must be at least 2 characters."),
  phone: z.string().min(9, "Phone number must be at least 9 digits.").optional().or(z.literal("")),
});

export const OrderItemSchema = z.object({
  productId: z.string().uuid("Invalid product ID."),
  quantity: z.number().int().positive("Quantity must be a positive integer."),
});

export const CreateOrderSchema = z.object({
  items: z.array(OrderItemSchema).min(1, "Order must contain at least one item."),
  bankAccountId: z.string().uuid("Invalid bank account selection."),
  deliveryAddress: z.string().min(5, "Delivery address must be provided."),
  phone: z.string().min(9, "Phone number must be at least 9 digits."),
  notes: z.string().optional(),
  paymentProofPath: z.string().optional(),
  buyerId: z.string().uuid().optional(),
});

export const SubmitDesignSchema = z.object({
  title: z.string().min(3, "Design title must be at least 3 characters."),
  description: z.string().min(5, "Description must be at least 5 characters."),
  filePath: z.string().min(1, "Uploaded dieline file path is required."),
});

export const CreateClassSessionSchema = z.object({
  type: z.enum(["in_person", "live"]),
  title: z.string().min(3, "Workshop title must be at least 3 characters."),
  description: z.string().min(5, "Description must be at least 5 characters."),
  teacher_id: z.string().uuid("Teacher ID must be a valid UUID.").optional(),
  location: z.string().optional(),
  starts_at: z.string().datetime("Start time must be a valid ISO datetime."),
  ends_at: z.string().datetime("End time must be a valid ISO datetime."),
  capacity: z.number().int().positive("Capacity must be at least 1 student."),
  price: z.number().min(0, "Price cannot be negative."),
});

export const BankAccountSchema = z.object({
  bank_name: z.string().min(2, "Bank name must be at least 2 characters."),
  account_name: z.string().min(2, "Account holder name is required."),
  account_number: z.string().min(5, "Account number must be valid."),
  instructions: z.string().optional(),
  is_active: z.boolean().optional(),
});
