import * as React from "react";
import { Link, useNavigate } from "react-router";
import { Button, Input, cn } from "../components/ui-components";
import { Chrome, Mail, Lock, ArrowRight, Loader2, AlertCircle, User } from "lucide-react";
import { toast } from "sonner";
import { motion } from "motion/react";
import { useAuth } from "../contexts/AuthContext";
import { Logo } from "../components/Logo";

export function LoginPage() {
  const navigate = useNavigate();
  const { currentUser, loginWithGoogle, loginWithEmail, signUpWithEmail } = useAuth();
  const [isLoading, setIsLoading] = React.useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [isSignUp, setIsSignUp] = React.useState(false);

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [displayName, setDisplayName] = React.useState("");

  // Redirect if already logged in
  React.useEffect(() => {
    if (currentUser) {
      navigate("/dashboard", { replace: true });
    }
  }, [currentUser, navigate]);

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setError("");
    try {
      await loginWithGoogle();
      toast.success("Welcome to CollabSpace!");
      navigate("/dashboard");
    } catch (err: any) {
      console.error("Google login error:", err);
      if (err.code === "auth/popup-closed-by-user") {
        setError("Sign-in popup was closed. Please try again.");
      } else {
        setError(err.message || "Failed to sign in with Google.");
      }
    }
    setIsGoogleLoading(false);
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      if (isSignUp) {
        if (!displayName.trim()) {
          setError("Please enter your name.");
          setIsLoading(false);
          return;
        }
        if (password.length < 6) {
          setError("Password must be at least 6 characters.");
          setIsLoading(false);
          return;
        }
        await signUpWithEmail(email, password, displayName.trim());
        toast.success("Account created! Welcome to CollabSpace!");
      } else {
        await loginWithEmail(email, password);
        toast.success("Welcome back!");
      }
      navigate("/dashboard");
    } catch (err: any) {
      console.error("Auth error:", err);
      const errorMap: Record<string, string> = {
        "auth/user-not-found": "No account found with this email.",
        "auth/wrong-password": "Incorrect password.",
        "auth/invalid-credential": "Invalid email or password.",
        "auth/email-already-in-use": "An account with this email already exists.",
        "auth/weak-password": "Password must be at least 6 characters.",
        "auth/invalid-email": "Please enter a valid email address.",
        "auth/too-many-requests": "Too many attempts. Please try again later.",
      };
      setError(errorMap[err.code] || err.message || "Authentication failed.");
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 aurora-bg grain-texture relative overflow-hidden">
      {/* Background orbs */}
      <div className="absolute top-[20%] left-[15%] w-80 h-80 bg-[#8B5CF6]/12 rounded-full blur-[120px]" />
      <div className="absolute bottom-[20%] right-[15%] w-72 h-72 bg-[#6EE7B7]/10 rounded-full blur-[100px]" />
      <div className="absolute top-[60%] left-[55%] w-48 h-48 bg-[#FB7185]/8 rounded-full blur-[80px]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full relative z-10"
      >
        <div className="text-center mb-8">
          <div className="inline-flex mb-6">
            <Logo height={44} linkTo="/" />
          </div>
          <h1 className="text-3xl font-bold text-[#1E1B4B] dark:text-[#E8E6F0]" style={{ fontFamily: 'var(--font-heading)' }}>
            {isSignUp ? "Create Your Account" : "Welcome Back"}
          </h1>
          <p className="text-[#6B7280] dark:text-[#9CA3AF] mt-2 text-[15px]">
            {isSignUp ? "Join the future of collaborative productivity." : "The future of collaborative productivity."}
          </p>
        </div>

        <div className="glass-panel-strong rounded-[24px] p-8 glow-border">
          <Button
            variant="outline"
            className="w-full h-12 flex gap-2 font-medium mb-6"
            onClick={handleGoogleLogin}
            isLoading={isGoogleLoading}
            disabled={isLoading}
          >
            <Chrome className="w-5 h-5 text-[#4285F4]" />
            Continue with Google
          </Button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[rgba(139,92,246,0.1)]" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-transparent text-[#6B7280] dark:text-[#9CA3AF] text-xs font-medium backdrop-blur-sm">OR</span>
            </div>
          </div>

          <form onSubmit={handleEmailSubmit} className="space-y-4">
            {isSignUp && (
              <div>
                <label className="block text-sm font-medium text-[#4B5563] dark:text-[#9CA3AF] mb-1.5">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF] z-10 pointer-events-none" />
                  <Input
                    className="pl-11 h-12"
                    type="text"
                    placeholder="John Smith"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-[#4B5563] dark:text-[#9CA3AF] mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF] z-10 pointer-events-none" />
                <Input
                  className="pl-11 h-12"
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-[#4B5563] dark:text-[#9CA3AF]">Password</label>
                {!isSignUp && (
                  <a href="#" className="text-xs text-[#6366F1] dark:text-[#C4B5FD] hover:underline font-medium">Forgot Password?</a>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF] z-10 pointer-events-none" />
                <Input
                  className="pl-11 h-12"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-[#EF4444] bg-[rgba(239,68,68,0.08)] p-3 rounded-[12px] text-sm font-medium border border-[rgba(239,68,68,0.15)]">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <Button type="submit" className="w-full h-12 font-bold text-lg" isLoading={isLoading} disabled={isGoogleLoading}>
              {isSignUp ? "Create Account" : "Sign In"} <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </form>

          <p className="text-center text-[#6B7280] dark:text-[#9CA3AF] text-sm mt-8">
            {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              onClick={() => { setIsSignUp(!isSignUp); setError(""); }}
              className="text-[#6366F1] dark:text-[#C4B5FD] font-bold hover:underline"
            >
              {isSignUp ? "Sign In" : "Sign Up Free"}
            </button>
          </p>
        </div>

        <p className="text-center text-[#9CA3AF] text-xs mt-8">
          By signing in, you agree to our <a href="#" className="underline hover:text-[#6366F1]">Terms of Service</a> and <a href="#" className="underline hover:text-[#6366F1]">Privacy Policy</a>.
        </p>
      </motion.div>
    </div>
  );
}
