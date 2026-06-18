"use client";

import { useEffect, useState } from "react";
import { HeartPulse, ScanFace, Fingerprint, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import { isNative, hapticSuccess } from "@/lib/native";
import {
  getBiometryInfo,
  isLockEnabled,
  setLockEnabled,
  verifyIdentity,
  type BiometryInfo,
} from "@/lib/biometric";
import { useAppleHealth } from "@/hooks/useAppleHealth";

// iOS-only device features. Rendered on every platform but shows a muted
// "Available in the iOS app" state when not running inside the native shell.
export function DeviceFeatures() {
  const [native, setNative] = useState(false);
  const [biometry, setBiometry] = useState<BiometryInfo>({
    available: false,
    type: "none",
  });
  const [lockOn, setLockOn] = useState(false);
  const { syncAll, syncing } = useAppleHealth();

  useEffect(() => {
    (async () => {
      setNative(await isNative());
      setBiometry(await getBiometryInfo());
      setLockOn(isLockEnabled());
    })();
  }, []);

  async function handleSync() {
    try {
      const res = await syncAll();
      const total = res.steps + res.weight + res.sleep;
      if (total === 0) {
        toast("No new Apple Health data to import.");
      } else {
        await hapticSuccess();
        toast.success(
          `Imported ${res.steps} days of steps, ${res.weight} weights, ${res.sleep} sleep records.`,
          { duration: 5000 }
        );
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Apple Health sync failed.");
    }
  }

  async function toggleLock() {
    if (lockOn) {
      setLockEnabled(false);
      setLockOn(false);
      toast.success("App lock disabled.");
      return;
    }
    const ok = await verifyIdentity("Confirm to enable app lock");
    if (!ok) {
      toast.error("Could not verify. Lock not enabled.");
      return;
    }
    setLockEnabled(true);
    setLockOn(true);
    await hapticSuccess();
    toast.success("App lock enabled.");
  }

  const lockLabel =
    biometry.type === "faceId"
      ? "Face ID"
      : biometry.type === "touchId"
      ? "Touch ID"
      : "Biometric";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mt-3">
      {/* Apple Health */}
      <div className="card">
        <div className="card-title flex items-center gap-2">
          <HeartPulse size={14} className="text-status-red" /> Apple Health
        </div>
        {native ? (
          <>
            <p className="text-[13px] text-text-2 mb-3">
              Import your <span className="text-text-1">steps, body weight,
              and sleep</span> from Apple Health into BodyTracker. Re-syncing is
              safe — existing days aren&apos;t duplicated.
            </p>
            <button
              className="btn btn-primary btn-sm"
              onClick={handleSync}
              disabled={syncing}
            >
              <RefreshCw size={14} className={syncing ? "animate-spin" : ""} />
              {syncing ? "Syncing…" : "Sync with Apple Health"}
            </button>
            <p className="text-[11px] text-text-3 mt-2">
              You&apos;ll be asked to grant Health permissions the first time.
            </p>
          </>
        ) : (
          <p className="text-[13px] text-text-3">
            Available in the iOS app. Open BodyTracker on your iPhone to sync
            Apple Health.
          </p>
        )}
      </div>

      {/* Biometric lock */}
      <div className="card">
        <div className="card-title flex items-center gap-2">
          {biometry.type === "touchId" ? (
            <Fingerprint size={14} className="text-accent" />
          ) : (
            <ScanFace size={14} className="text-accent" />
          )}
          App Lock
        </div>
        {native && biometry.available ? (
          <>
            <p className="text-[13px] text-text-2 mb-3">
              Require <span className="text-text-1">{lockLabel}</span> to open
              BodyTracker. The app locks whenever it returns to the foreground.
            </p>
            <button
              className={lockOn ? "btn btn-danger btn-sm" : "btn btn-primary btn-sm"}
              onClick={toggleLock}
            >
              {lockOn ? `Disable ${lockLabel} lock` : `Enable ${lockLabel} lock`}
            </button>
            <p className="text-[11px] text-text-3 mt-2">
              This setting is stored on this device only.
            </p>
          </>
        ) : native ? (
          <p className="text-[13px] text-text-3">
            No Face ID / Touch ID is set up on this device.
          </p>
        ) : (
          <p className="text-[13px] text-text-3">
            Available in the iOS app. Lock BodyTracker behind Face ID or Touch
            ID on your iPhone.
          </p>
        )}
      </div>
    </div>
  );
}
