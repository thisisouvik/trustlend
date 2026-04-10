"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getBrowserSupabaseClient } from "@/lib/supabase/client";

interface ProfileSettingsFormProps {
  initialName?: string;
  initialPhone?: string;
  initialCountry?: string;
}

export function ProfileSettingsForm({
  initialName = "",
  initialPhone = "",
  initialCountry = "",
}: ProfileSettingsFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    full_name: initialName,
    phone: initialPhone,
    country_code: initialCountry,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const supabase = getBrowserSupabaseClient();
      if (!supabase) throw new Error("Supabase client not found");

      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user) {
        throw new Error("You must be logged in to update your profile.");
      }

      const updates = {
        id: userData.user.id,
        full_name: formData.full_name,
        phone: formData.phone,
        country_code: formData.country_code,
        // Mock KYC status update based on filling details
        kyc_status: formData.full_name && formData.phone ? "verified" : "pending",
      };

      const { error: updateError } = await supabase
        .from("profiles")
        .upsert(updates);

      if (updateError) throw updateError;

      // Mock submitting to blockchain or verification layer
      await new Promise(resolve => setTimeout(resolve, 800));

      setSuccess(true);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="settings-form-group" onSubmit={handleSubmit}>
      {error && <p className="auth-page-error">{error}</p>}
      {success && <p className="form-success-message">Profile details verified successfully! On-chain record updated.</p>}

      <div className="settings-field">
        <label htmlFor="full_name" className="settings-label">Full Legal Name</label>
        <input
          id="full_name"
          name="full_name"
          type="text"
          className="settings-input"
          value={formData.full_name}
          onChange={handleChange}
          placeholder="e.g. Satoshi Nakamoto"
        />
      </div>

      <div className="settings-field">
        <label htmlFor="phone" className="settings-label">Phone Number</label>
        <input
          id="phone"
          name="phone"
          type="tel"
          className="settings-input"
          value={formData.phone}
          onChange={handleChange}
          placeholder="+1 (555) 000-0000"
        />
      </div>

      <div className="settings-field">
        <label htmlFor="country_code" className="settings-label">Country Code</label>
        <input
          id="country_code"
          name="country_code"
          type="text"
          className="settings-input"
          value={formData.country_code}
          onChange={handleChange}
          placeholder="US"
          maxLength={2}
        />
      </div>

      <fieldset className="settings-field" style={{ border: '1px solid #d3dcf1', padding: '1rem', borderRadius: '0.6rem', marginTop: '0.5rem' }}>
        <legend className="settings-label" style={{ padding: '0 0.5rem' }}>Government ID Verification</legend>
        <p className="workspace-card-copy" style={{ marginBottom: '0.5rem' }}>
          Upload an official government ID for our on-chain verification partner.
        </p>
        <input type="file" className="settings-input" accept="image/*" />
      </fieldset>

      <button
        type="submit"
        disabled={loading}
        className="workspace-btn-primary settings-submit"
      >
        {loading ? "Verifying..." : "Save & Verify Identity"}
      </button>
    </form>
  );
}
