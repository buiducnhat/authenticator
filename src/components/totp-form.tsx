import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { zodResolver } from "@hookform/resolvers/zod";
import { Copy } from "lucide-react";
import * as OTPAuth from "otpauth";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

const formSchema = z.object({
  secret: z.string(),
  digits: z.number().min(1).max(10).default(6),
  period: z.number().min(1).max(3600).default(30),
});

export function TOTPForm() {
  const [otp, setOtp] = useState("");
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      secret: "",
      digits: 6,
      period: 30,
    },
  });
  const { period } = form.watch();

  const onSubmit = async (_data: z.infer<typeof formSchema>) => {};

  const getCurrentSeconds = useCallback(() => {
    return Math.round(Date.now() / 1000.0);
  }, []);

  const update = useCallback(() => {
    setRemainingSeconds(period - (getCurrentSeconds() % period));

    const { digits, secret } = form.watch();

    if (!secret || secret.length === 0 || !digits || !period) {
      return;
    }

    const totp = new OTPAuth.TOTP({
      digits,
      period,
      secret: OTPAuth.Secret.fromBase32(secret),
      algorithm: "SHA1",
    });

    setOtp(totp.generate());
  }, [form]);

  useEffect(() => {
    const interval = setInterval(() => {
      update();
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [update]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Authenticator</CardTitle>
        <CardDescription>Time-based OTP</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col space-y-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-4">
              <FormField
                control={form.control}
                name="secret"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Secret key</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your secret key" type="text" {...field} />
                    </FormControl>

                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-12 gap-x-4">
                <div className="col-span-6">
                  <FormField
                    control={form.control}
                    name="digits"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Number of Digits</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter number of digits (1-10)"
                            type="number"
                            {...field}
                          />
                        </FormControl>

                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="col-span-6">
                  <FormField
                    control={form.control}
                    name="period"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Period</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter period in seconds (1-3600)"
                            type="number"
                            {...field}
                          />
                        </FormControl>

                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </form>
          </Form>

          {otp ? (
            <>
              <div className="w-full flex flex-col space-y-2">
                <span className="text-xs text-muted-foreground">
                  {remainingSeconds} seconds remaining
                </span>
                <Progress className="w=-full" value={(remainingSeconds / period) * 100} />
              </div>

              <div className="flex justify-center relative">
                <div className="text-2xl font-bold">{otp}</div>
                <Button
                  variant="outline"
                  className="absolute right-0"
                  onClick={() => {
                    navigator.clipboard.writeText(otp);
                    toast.info("Copied to clipboard");
                  }}
                >
                  <Copy />
                </Button>
              </div>
            </>
          ) : (
            <div>
              <div className="text-muted-foreground text-sm text-center">
                Enter your secret key to continue
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
