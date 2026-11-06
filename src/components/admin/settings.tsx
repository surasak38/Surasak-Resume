"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { changeHandle, setVisibility } from "@/app/[handle]/admin/actions";
import { createClient } from "@/lib/supabase/client";
import { Toggle } from "./fields";

const PATTERN = /^[a-z0-9](?:[a-z0-9._-]{1,28}[a-z0-9])$/;
const btn = "rounded-md border border-ink px-4 py-2 text-sm font-medium transition-opacity disabled:opacity-40";

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-rule py-8 first:border-t-0 first:pt-0">
      <h2 className="font-display text-2xl font-semibold tracking-tight" style={{ fontVariationSettings: '"wdth" 80' }}>
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function Settings({
  handle,
  email,
  isPublic,
}: {
  handle: string;
  email: string;
  isPublic: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [next, setNext] = useState(handle);
  const [check, setCheck] = useState<{ value: string; free: boolean } | null>(null);
  const [handleMsg, setHandleMsg] = useState("");
  const [visible, setVisible] = useState(isPublic);
  const [visibilityMsg, setVisibilityMsg] = useState("");

  const candidate = next.trim().toLowerCase();
  useEffect(() => {
    if (candidate === handle || !PATTERN.test(candidate)) return;
    const timer = setTimeout(async () => {
      const { data } = await createClient().rpc("handle_available", { candidate });
      setCheck({ value: candidate, free: Boolean(data) });
    }, 350);
    return () => clearTimeout(timer);
  }, [candidate, handle]);

  const state =
    candidate === handle ? "same" : !PATTERN.test(candidate) ? "invalid" : check?.value !== candidate ? "checking" : check.free ? "free" : "taken";
  const status = {
    same: "This is your current link.",
    invalid: "3–30 lowercase letters, numbers, dot, dash or underscore, starting and ending with a letter or number.",
    checking: "Checking…",
    free: "Available",
    taken: "Taken or reserved. Try another.",
  }[state];

  const saveHandle = () =>
    start(async () => {
      const res = await changeHandle(candidate);
      if (!res.ok) return setHandleMsg(res.error);
      setHandleMsg(`Your link is now /${res.handle}/profile. The old link no longer works.`);
      router.replace(`/${res.handle}/admin?tab=settings`);
    });

  const toggleVisibility = (v: boolean) =>
    start(async () => {
      setVisible(v);
      const res = await setVisibility(v);
      if (!res.ok) {
        setVisible(!v);
        return setVisibilityMsg(res.error);
      }
      setVisibilityMsg(v ? "Your profile is public and appears in search." : "Your profile is hidden. Only you can see it while signed in.");
    });


  return (
    <section>
      <h1 className="font-display text-3xl font-semibold tracking-tight" style={{ fontVariationSettings: '"wdth" 80' }}>
        Link &amp; account
      </h1>
      <p className="mb-8 mt-1 max-w-[70ch] text-muted">Your public link, who can see your resume, and your account.</p>

      <Block title="Your link">
        <div className="flex max-w-xl flex-wrap items-center gap-3">
          <div className="flex min-w-0 flex-1 items-center rounded-md border border-rule bg-paper focus-within:border-ink">
            <span className="select-none pl-3 text-muted">/</span>
            <input
              aria-label="Your link"
              value={next}
              onChange={(e) => setNext(e.target.value.toLowerCase().replace(/\s+/g, ""))}
              autoCapitalize="none"
              spellCheck={false}
              aria-describedby="handle-status"
              className="min-w-0 flex-1 bg-transparent px-1 py-2 outline-none"
            />
            <span className="select-none pr-3 text-muted">/profile</span>
          </div>
          <button type="button" className={btn} disabled={pending || state !== "free"} onClick={saveHandle}>
            Change link
          </button>
        </div>
        <p id="handle-status" aria-live="polite" className="mt-2 text-xs text-muted">
          {state === "free" ? "✓ " : ""}
          {status}
        </p>
        {handleMsg && (
          <p role="status" className="mt-2 text-sm">
            {handleMsg}
          </p>
        )}
      </Block>

      <Block title="Visibility">
        <div className="max-w-xl divide-y divide-rule border-y border-rule">
          <Toggle label="Public profile" hint="Anyone with the link can see it, and it appears in search." checked={visible} onChange={toggleVisibility} />
        </div>
        {visibilityMsg && (
          <p role="status" className="mt-2 text-sm">
            {visibilityMsg}
          </p>
        )}
      </Block>


      <Block title="Account">
        <p className="text-sm">
          Signed in as <span className="font-medium">{email}</span>
        </p>
      </Block>
    </section>
  );
}
