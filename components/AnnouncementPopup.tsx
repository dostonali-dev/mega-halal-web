"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Announcement = {
  id: number;
  message: string;
  image: string | null;
  link: string | null;
};

export default function AnnouncementPopup() {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .eq("active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error || !data) return;

      const dismissedId = localStorage.getItem("mhs_dismissed_announcement_id");
      if (dismissedId === String(data.id)) return;

      setAnnouncement(data);
      setVisible(true);
    };
    load();
  }, []);

  const handleClose = () => {
    if (dontShowAgain && announcement) {
      localStorage.setItem("mhs_dismissed_announcement_id", String(announcement.id));
    }
    setVisible(false);
  };

  if (!visible || !announcement) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-sm w-full overflow-hidden relative">
        <button
          onClick={handleClose}
          className="absolute top-2 right-2 bg-black/40 text-white w-8 h-8 rounded-full flex items-center justify-center z-10"
        >
          ✕
        </button>

        {announcement.image && (
          <img src={announcement.image} alt="e'lon" className="w-full h-48 object-cover" />
        )}

        <div className="p-5">
          <p className="text-black whitespace-pre-line mb-4">{announcement.message}</p>

          {announcement.link && (
              <a
                href={announcement.link}
                className="block bg-green-600 text-white text-center py-2.5 rounded-xl font-bold mb-3"
              >
                Batafsil
              </a>
            )}

          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
            />
            Qayta ko'rsatma
          </label>
        </div>
      </div>
    </div>
  );
}