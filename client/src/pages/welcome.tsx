import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Beer, Mail, ArrowRight } from "lucide-react";

export default function Welcome() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [step, setStep] = useState<"email" | "verification" | "profile">("email");
  const [userEmail, setUserEmail] = useState("");
  const { toast } = useToast();

  // Profile fields for new users
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [location, setUserLocation] = useState("");

  const sendCodeMutation = useMutation({
    mutationFn: async (email: string) => {
      return await apiRequest("/api/auth/send-code", "POST", { email });
    },
    onSuccess: () => {
      setUserEmail(email);
      setStep("verification");
      toast({
        title: "Verification code sent",
        description: "Check your email for a 6-digit verification code",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to send code",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const verifyCodeMutation = useMutation({
    mutationFn: async ({ email, code }: { email: string; code: string }) => {
      return await apiRequest("/api/auth/verify-code", "POST", { email, code });
    },
    onSuccess: (data: any) => {
      if (data.isNewUser) {
        setStep("profile");
      } else {
        // Store user data in localStorage for session management
        localStorage.setItem("beer-hop-user", JSON.stringify(data.user));
        toast({
          title: "Welcome back!",
          description: `Good to see you again, ${data.user.name}`,
        });
        setLocation("/");
      }
    },
    onError: (error: any) => {
      toast({
        title: "Invalid code",
        description: error.message || "Please check your code and try again",
        variant: "destructive",
      });
    },
  });

  const completeProfileMutation = useMutation({
    mutationFn: async (profileData: any) => {
      return await apiRequest("/api/auth/complete-profile", "POST", profileData);
    },
    onSuccess: (data: any) => {
      // Store user data in localStorage for session management
      localStorage.setItem("beer-hop-user", JSON.stringify(data.user));
      toast({
        title: "Welcome to Beer Hop!",
        description: "Your account has been created successfully",
      });
      setLocation("/");
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create account",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const handleSendCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }
    sendCodeMutation.mutate(email);
  };

  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode || verificationCode.length !== 6) {
      toast({
        title: "Invalid code",
        description: "Please enter the 6-digit verification code",
        variant: "destructive",
      });
      return;
    }
    verifyCodeMutation.mutate({ email: userEmail, code: verificationCode });
  };

  const handleCompleteProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !name) {
      toast({
        title: "Missing information",
        description: "Username and name are required",
        variant: "destructive",
      });
      return;
    }
    completeProfileMutation.mutate({
      email: userEmail,
      username,
      name,
      location: location || null,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Beer className="h-12 w-12 text-amber-600 mr-2" />
            <h1 className="text-3xl font-bold text-amber-900">Beer Hop</h1>
          </div>
          <p className="text-amber-700">Discover breweries, check in, compete with friends</p>
        </div>

        {/* Email Step */}
        {step === "email" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Mail className="h-5 w-5 mr-2 text-amber-600" />
                Welcome to Beer Hop
              </CardTitle>
              <CardDescription>
                Enter your email to get started. We'll send you a verification code.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSendCode} className="space-y-4">
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={sendCodeMutation.isPending}
                />
                <Button 
                  type="submit" 
                  className="w-full bg-amber-600 hover:bg-amber-700"
                  disabled={sendCodeMutation.isPending}
                >
                  {sendCodeMutation.isPending ? "Sending..." : "Send Verification Code"}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Verification Step */}
        {step === "verification" && (
          <Card>
            <CardHeader>
              <CardTitle>Enter Verification Code</CardTitle>
              <CardDescription>
                We sent a 6-digit code to {userEmail}. Check your email and enter it below.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleVerifyCode} className="space-y-4">
                <Input
                  type="text"
                  placeholder="123456"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  disabled={verifyCodeMutation.isPending}
                  maxLength={6}
                  className="text-center text-2xl tracking-widest"
                />
                <Button 
                  type="submit" 
                  className="w-full bg-amber-600 hover:bg-amber-700"
                  disabled={verifyCodeMutation.isPending}
                >
                  {verifyCodeMutation.isPending ? "Verifying..." : "Verify Code"}
                </Button>
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => setStep("email")}
                  className="w-full"
                >
                  Back to Email
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Profile Completion Step */}
        {step === "profile" && (
          <Card>
            <CardHeader>
              <CardTitle>Complete Your Profile</CardTitle>
              <CardDescription>
                Just a few more details to get you started on Beer Hop.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCompleteProfile} className="space-y-4">
                <Input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
                  disabled={completeProfileMutation.isPending}
                  required
                />
                <Input
                  type="text"
                  placeholder="Your Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={completeProfileMutation.isPending}
                  required
                />
                <Input
                  type="text"
                  placeholder="City, State (Optional)"
                  value={location}
                  onChange={(e) => setUserLocation(e.target.value)}
                  disabled={completeProfileMutation.isPending}
                />
                <Button 
                  type="submit" 
                  className="w-full bg-amber-600 hover:bg-amber-700"
                  disabled={completeProfileMutation.isPending}
                >
                  {completeProfileMutation.isPending ? "Creating Account..." : "Complete Profile"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-amber-600">
          <p>By continuing, you agree to our Terms of Service and Privacy Policy</p>
        </div>
      </div>
    </div>
  );
}