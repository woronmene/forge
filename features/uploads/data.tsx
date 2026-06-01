"use client";

import Image from "next/image";
import { Calendar, ChevronDown, Play, Plus, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import type { UploadType } from "@/types/dashboard";
import {
  FieldLabel,
  InputLike,
  SectionTitle,
  SelectField,
  SurfaceCard,
  StatusBadge,
  TextAreaField,
  TextField,
} from "@/components/page-primitives";

type FormSection = {
  title: string;
  body: React.ReactNode;
};

export type UploadPageConfig = {
  label: string;
  icon: string;
  activeIcon: string;
  topSections: FormSection[];
  rightRail: React.ReactNode;
  footerNotice: string;
};

function UploadedFileCard({
  name,
  meta,
  status = "uploaded",
}: {
  name: string;
  meta: string;
  status?: "uploaded" | "progress";
}) {
  return (
    <div className="rounded-[16px] border border-[#E6E7EC] bg-white px-4 py-4">
      <div className="flex items-start gap-4 max-sm:flex-col">
        <div className="flex h-[42px] w-[42px] items-center justify-center rounded-full bg-[#EDF0FF] text-[#3150FF]">
          <div className="flex h-7 w-7 items-center justify-center rounded-full border border-current">
            <div className="h-3.5 w-2 rounded-[2px] border border-current" />
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-4 max-sm:flex-col max-sm:items-start">
            <div className="min-w-0">
              <p className="truncate text-[16px] font-semibold tracking-[-0.03em] text-[#16181D]">{name}</p>
              <p className="mt-1 text-[13px] text-[#7B8088]">{meta}</p>
            </div>

            <div className="flex w-full items-center gap-4 max-sm:justify-between">
              {status === "uploaded" ? (
                <StatusBadge tone="ready">Uploaded</StatusBadge>
              ) : (
                <div className="min-w-0 flex-1 max-sm:max-w-[220px]">
                  <div className="flex items-center justify-between text-[13px] text-[#7B8088]">
                    <span>Uploading...</span>
                    <span>68%</span>
                  </div>
                  <div className="mt-2 h-[5px] rounded-full bg-[#E9ECF5]">
                    <div className="h-[5px] w-[68%] rounded-full bg-[#3150FF]" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function UploadPanel({
  title,
  children,
  className,
}: {
  title: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <SurfaceCard className={className}>
      <div className="p-6 xl:p-7">
        <SectionTitle>{title}</SectionTitle>
        <div className="mt-6 space-y-4">{children}</div>
      </div>
    </SurfaceCard>
  );
}

function PreviewCard({ title }: { title: string }) {
  const [hasUpload, setHasUpload] = useState(false);

  return (
    <SurfaceCard>
      <div className="p-6 xl:p-7">
        <SectionTitle>{title}</SectionTitle>
        <div
          className="mt-5 cursor-pointer rounded-[18px] bg-[#121B2D] px-8 py-16 text-center text-[#696D78]"
          onClick={() => setHasUpload((current) => !current)}
        >
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[10px] border border-[#696D78]">
            <Play className="h-6 w-6 stroke-[1.7]" />
          </div>
          <p className="mt-3 text-[16px]">{hasUpload ? "thumbnail-v2.png uploaded" : "Click to upload"}</p>
        </div>
        <p className="mt-5 text-[12px] text-[#A1A1AA]">JPG or PNG • Min 1280×720px • Max 5 MB</p>
      </div>
    </SurfaceCard>
  );
}

function TrailerUrlPanel() {
  const [url, setUrl] = useState("");

  return (
    <UploadPanel title="Trailer">
      <div>
        <FieldLabel>Trailer URL</FieldLabel>
        <TextField value={url} onChange={setUrl} placeholder="https://..." type="url" />
      </div>
    </UploadPanel>
  );
}

function AccessVisibilityCard({
  subscription = "Basic",
  visibility = "Published",
  rating = "PG-13",
}: {
  subscription?: string;
  visibility?: string;
  rating?: string;
}) {
  const [subscriptionValue, setSubscriptionValue] = useState(subscription);
  const [visibilityValue, setVisibilityValue] = useState(visibility);
  const [ratingValue, setRatingValue] = useState(rating);

  return (
    <SurfaceCard>
      <div className="p-6 xl:p-7">
        <SectionTitle>Access &amp; visibility</SectionTitle>
        <div className="mt-5 space-y-4">
          <div>
            <FieldLabel>Subscription tier</FieldLabel>
            <SelectField value={subscriptionValue} onChange={setSubscriptionValue} options={["Free", "Basic", "Premium", "VIP"]} />
          </div>
          <div>
            <FieldLabel>Visibility</FieldLabel>
            <SelectField value={visibilityValue} onChange={setVisibilityValue} options={["Published", "Private", "Scheduled", "Draft"]} />
          </div>
          <div>
            <FieldLabel>Content rating</FieldLabel>
            <SelectField value={ratingValue} onChange={setRatingValue} options={["G", "PG", "PG-13", "16", "18"]} />
          </div>
        </div>
      </div>
    </SurfaceCard>
  );
}

function RequiredNotice({ text }: { text: string }) {
  return (
    <SurfaceCard className="border-[#F2D172] bg-[#FFF9E7]">
      <div className="p-6 xl:p-7">
        <div className="flex items-start gap-4">
          <div className="mt-1 h-5 w-5 rounded-full border border-[#E09116] text-center text-[11px] leading-[18px] text-[#E09116]">
            !
          </div>
          <div>
            <p className="text-[16px] font-semibold tracking-[-0.03em] text-[#A55917]">Required fields</p>
            <p className="mt-2 max-w-[320px] text-[13px] leading-6 text-[#B56B23]">{text}</p>
          </div>
        </div>
      </div>
    </SurfaceCard>
  );
}

function SubtitlePanel({ filename, status = "uploaded" }: { filename: string; status?: "uploaded" | "progress" }) {
  const [subtitles, setSubtitles] = useState([{ name: filename, status }] as { name: string; status: "uploaded" | "progress" }[]);

  return (
    <UploadPanel
      title={
        <>
          Subtitles <span className="font-normal text-[#7C8089]">(SRT files)</span>
        </>
      }
    >
      {subtitles.map((subtitle, index) => (
        <div key={`${subtitle.name}-${index}`} className="relative">
          <UploadedFileCard name={subtitle.name} meta="" status={subtitle.status} />
          <button
            type="button"
            onClick={() => setSubtitles((current) => current.filter((_, itemIndex) => itemIndex !== index))}
            className="absolute right-4 top-4 text-[#A1A5B0]"
            aria-label={`Remove ${subtitle.name}`}
          >
            <X className="h-5 w-5 stroke-[2.2]" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() =>
          setSubtitles((current) => [
            ...current,
            { name: `subtitle-${current.length + 1}.srt`, status: "uploaded" },
          ])
        }
        className="flex h-[52px] w-full items-center justify-center rounded-[999px] border border-dashed border-[#D9DDE7] bg-white text-[15px] font-medium text-[#16181D]"
      >
        <Plus className="mr-3 h-5 w-5" />
        Add subtitle file
      </button>
    </UploadPanel>
  );
}

function TwoColFields({
  left,
  right,
}: {
  left: React.ReactNode;
  right: React.ReactNode;
}) {
  return <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">{left}{right}</div>;
}

function RenderMovieDetails() {
  const [title, setTitle] = useState("Lagos After Dark");
  const [description, setDescription] = useState(
    "A gripping thriller set in the heart of Lagos, following a detective who uncovers a conspiracy that reaches the highest levels of power.",
  );
  const [genre, setGenre] = useState("Thriller");
  const [releaseDate, setReleaseDate] = useState("27/03/2026");
  const [runtime, setRuntime] = useState("");
  const [country, setCountry] = useState("Nigeria");
  const [cast, setCast] = useState("Chisom Nwosu, Bayo Ola, Amina Diallo");
  const [director, setDirector] = useState("Kemi Adesanya");

  return (
    <UploadPanel title="Movie details">
      <div>
        <FieldLabel required>Movie title</FieldLabel>
        <TextField value={title} onChange={setTitle} />
      </div>
      <div>
        <FieldLabel>Description</FieldLabel>
        <TextAreaField className="min-h-[164px] leading-8" value={description} onChange={setDescription} />
      </div>
      <TwoColFields
        left={
          <div>
            <FieldLabel required>Genre</FieldLabel>
            <SelectField value={genre} onChange={setGenre} options={["Thriller", "Drama", "Comedy", "Action"]} />
          </div>
        }
        right={
          <div>
            <FieldLabel>Release date</FieldLabel>
            <TextField value={releaseDate} onChange={setReleaseDate} />
          </div>
        }
      />
      <TwoColFields
        left={
          <div>
            <FieldLabel>Runtime</FieldLabel>
            <TextField value={runtime} onChange={setRuntime} placeholder="e.g. 1h 52m" />
          </div>
        }
        right={
          <div>
            <FieldLabel>Country of origin</FieldLabel>
            <SelectField value={country} onChange={setCountry} options={["Nigeria", "Ghana", "Kenya", "South Africa"]} />
          </div>
        }
      />
      <div>
        <FieldLabel mutedSuffix="separate with commas">Cast</FieldLabel>
        <TextField value={cast} onChange={setCast} />
      </div>
      <div>
        <FieldLabel>Director</FieldLabel>
        <TextField value={director} onChange={setDirector} />
      </div>
    </UploadPanel>
  );
}

function RenderSeriesDetails() {
  const [title, setTitle] = useState("Kings of Lagos");
  const [season, setSeason] = useState("Season 1");
  const [episodeNumber, setEpisodeNumber] = useState("1");
  const [episodeTitle, setEpisodeTitle] = useState("Pilot");
  const [description, setDescription] = useState(
    "A Lagos entrepreneur navigates the city's cutthroat business world while keeping his family together.",
  );
  const [genre, setGenre] = useState("Drama");
  const [releaseDate, setReleaseDate] = useState("27/03/2026");
  const [cast, setCast] = useState("Tobi Adeyemi, Chisom Nwosu, Bayo Ola");
  const [director, setDirector] = useState("Kemi Adesanya");

  return (
    <UploadPanel title="Series details">
      <div>
        <FieldLabel required>Series title</FieldLabel>
        <TextField value={title} onChange={setTitle} />
      </div>
      <TwoColFields
        left={
          <div>
            <FieldLabel required>Season</FieldLabel>
            <SelectField value={season} onChange={setSeason} options={["Season 1", "Season 2", "Season 3"]} />
          </div>
        }
        right={
          <div>
            <FieldLabel required>Episode number</FieldLabel>
            <TextField value={episodeNumber} onChange={setEpisodeNumber} />
          </div>
        }
      />
      <div>
        <FieldLabel>Episode title</FieldLabel>
        <TextField value={episodeTitle} onChange={setEpisodeTitle} />
      </div>
      <div>
        <FieldLabel>Description</FieldLabel>
        <TextAreaField className="min-h-[124px]" value={description} onChange={setDescription} />
      </div>
      <TwoColFields
        left={
          <div>
            <FieldLabel required>Genre</FieldLabel>
            <SelectField value={genre} onChange={setGenre} options={["Drama", "Thriller", "Comedy", "Romance"]} />
          </div>
        }
        right={
          <div>
            <FieldLabel>Release date</FieldLabel>
            <TextField value={releaseDate} onChange={setReleaseDate} />
          </div>
        }
      />
      <div>
        <FieldLabel mutedSuffix="separate with commas">Cast</FieldLabel>
        <TextField value={cast} onChange={setCast} />
      </div>
      <div>
        <FieldLabel>Director</FieldLabel>
        <TextField value={director} onChange={setDirector} />
      </div>
    </UploadPanel>
  );
}

function RenderAlbumDetails() {
  const [title, setTitle] = useState("Motherland");
  const [artist, setArtist] = useState("Burna Boy");
  const [genre, setGenre] = useState("Afropop");
  const [releaseDate, setReleaseDate] = useState("27/03/2026");
  const [label, setLabel] = useState("");
  const [description, setDescription] = useState("A 14-track exploration of African identity, roots and diaspora culture.");

  return (
    <UploadPanel title="Album details">
      <div>
        <FieldLabel required>Album title</FieldLabel>
        <TextField value={title} onChange={setTitle} />
      </div>
      <TwoColFields
        left={
          <div>
            <FieldLabel required>Artist</FieldLabel>
            <TextField value={artist} onChange={setArtist} />
          </div>
        }
        right={
          <div>
            <FieldLabel required>Genre</FieldLabel>
            <SelectField value={genre} onChange={setGenre} options={["Afropop", "Afrobeats", "Amapiano", "Highlife"]} />
          </div>
        }
      />
      <TwoColFields
        left={
          <div>
            <FieldLabel>Release date</FieldLabel>
            <TextField value={releaseDate} onChange={setReleaseDate} />
          </div>
        }
        right={
          <div>
            <FieldLabel>Label</FieldLabel>
            <TextField value={label} onChange={setLabel} placeholder="Record label" />
          </div>
        }
      />
      <div>
        <FieldLabel>Description</FieldLabel>
        <TextAreaField className="min-h-[124px]" value={description} onChange={setDescription} />
      </div>
    </UploadPanel>
  );
}

function RenderTrackList() {
  const [tracks, setTracks] = useState([
    { title: "Roots", meta: "2h 10m · Burna Boy", uploaded: true },
    { title: "Lagos Love", meta: "3m 50s · Burna Boy ft. Wizkid", uploaded: true },
  ]);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftArtist, setDraftArtist] = useState("");

  return (
    <UploadPanel title="Track list">
      <p className="-mt-1 text-[13px] text-[#A1A1AA]">
        Each track is transcoded separately — upload an individual audio file per track
      </p>
      <div className="space-y-3">
        {tracks.map((track, index) => (
          <div key={`${track.title}-${index}`} className="rounded-[16px] border border-[#E6E7EC] px-4 py-4">
            <div className="flex items-center gap-4">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#EEF1FF] text-[12px] font-semibold text-[#3150FF]">
                {index + 1}
              </span>
              <div className="flex-1">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[15px] font-semibold text-[#16181D]">{track.title}</p>
                    <p className="mt-1 text-[12px] text-[#A1A1AA]">{track.meta}</p>
                  </div>
                  <StatusBadge tone="ready">{track.uploaded ? "Uploaded" : "Draft"}</StatusBadge>
                </div>
              </div>
            </div>
          </div>
        ))}
        <div className="rounded-[16px] border border-[#E6E7EC] px-4 py-4">
          <div className="space-y-3">
            <div>
              <FieldLabel required>Track title</FieldLabel>
              <TextField value={draftTitle} onChange={setDraftTitle} placeholder="e.g. Midnight in Accra" />
            </div>
            <div>
              <FieldLabel mutedSuffix="optional">Featured artist</FieldLabel>
              <TextField value={draftArtist} onChange={setDraftArtist} placeholder="e.g. Wizkid, Davido" />
            </div>
            <div>
              <FieldLabel>Audio file</FieldLabel>
              <button
                type="button"
                className="inline-flex items-center rounded-full border border-[#C7D5FF] bg-[#F5F8FF] px-4 py-2 text-[12px] font-medium text-[#3150FF]"
              >
                Upload file
              </button>
            </div>
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={() => {
          if (!draftTitle.trim()) return;
          setTracks((current) => [
            ...current,
            {
              title: draftTitle,
              meta: draftArtist ? `3m 32s · ${draftArtist}` : "3m 32s",
              uploaded: true,
            },
          ]);
          setDraftTitle("");
          setDraftArtist("");
        }}
        className="flex h-[52px] w-full items-center justify-center rounded-[999px] border border-dashed border-[#D9DDE7] text-[15px] font-medium text-[#16181D]"
      >
        <Plus className="mr-2 h-5 w-5" />
        Add track
      </button>
    </UploadPanel>
  );
}

function RenderMixDetails() {
  const [title, setTitle] = useState("Afrobeats Vibes Vol. 3");
  const [artist, setArtist] = useState("DJ Kobby");
  const [genre, setGenre] = useState("Afrobeats");
  const [duration, setDuration] = useState("1h 12m");
  const [releaseDate, setReleaseDate] = useState("27/03/2026");
  const [description, setDescription] = useState(
    "A high-energy mix featuring the biggest Afrobeats tracks of the year, blending hits from Wizkid, Davido, Arya Starr and more.",
  );

  return (
    <UploadPanel title="Mix details">
      <div>
        <FieldLabel required>Mix title</FieldLabel>
        <TextField value={title} onChange={setTitle} />
      </div>
      <TwoColFields
        left={
          <div>
            <FieldLabel required>DJ / Artist</FieldLabel>
            <TextField value={artist} onChange={setArtist} />
          </div>
        }
        right={
          <div>
            <FieldLabel required>Genre</FieldLabel>
            <SelectField value={genre} onChange={setGenre} options={["Afrobeats", "Amapiano", "Dancehall", "House"]} />
          </div>
        }
      />
      <TwoColFields
        left={
          <div>
            <FieldLabel>Duration</FieldLabel>
            <TextField value={duration} onChange={setDuration} />
          </div>
        }
        right={
          <div>
            <FieldLabel>Release date</FieldLabel>
            <TextField value={releaseDate} onChange={setReleaseDate} />
          </div>
        }
      />
      <div>
        <FieldLabel>Description</FieldLabel>
        <TextAreaField className="min-h-[124px]" value={description} onChange={setDescription} />
      </div>
    </UploadPanel>
  );
}

function RenderCuePoints() {
  const [cues, setCues] = useState([
    { title: "Essence", artist: "Arya Starr", time: "00:00" },
    { title: "Rush", artist: "Arya Starr", time: "03:42" },
  ]);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftArtist, setDraftArtist] = useState("");
  const [draftTime, setDraftTime] = useState("00:00");

  return (
    <UploadPanel title="Track listing">
      <p className="-mt-1 text-[13px] leading-6 text-[#A1A1AA]">
        Optional — text only, no file uploads. Cue points tell listeners where each song starts inside the mix.
      </p>
      <div className="rounded-[16px] border border-[#F1D088] bg-[#FFF9E8] px-4 py-3 text-[12px] leading-5 text-[#B56B23]">
        The mix is stored as one single file. This track list is for display only — it shows listeners what&apos;s in the mix. Cue times are approximate.
      </div>
      <div className="space-y-3">
        {cues.map((cue, index) => (
          <div key={`${cue.title}-${index}`} className="rounded-[16px] border border-[#E6E7EC] px-4 py-4">
            <div className="flex items-center gap-4">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#EEF1FF] text-[12px] font-semibold text-[#3150FF]">
                {index + 1}
              </span>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[15px] font-semibold text-[#16181D]">{cue.title}</p>
                    <p className="mt-1 text-[12px] text-[#A1A1AA]">{cue.artist}</p>
                  </div>
                  <span className="text-[12px] font-semibold text-[#3150FF]">{cue.time}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
        <div className="rounded-[16px] border border-[#E6E7EC] px-4 py-4">
          <div className="space-y-3">
            <div>
              <FieldLabel required>Track title</FieldLabel>
              <TextField value={draftTitle} onChange={setDraftTitle} placeholder="e.g. Essence" />
            </div>
            <div>
              <FieldLabel>Original artist</FieldLabel>
              <TextField value={draftArtist} onChange={setDraftArtist} placeholder="e.g. Wizkid" />
            </div>
            <div>
              <FieldLabel>Time (MM:SS)</FieldLabel>
              <TextField value={draftTime} onChange={setDraftTime} />
            </div>
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={() => {
          if (!draftTitle.trim()) return;
          setCues((current) => [...current, { title: draftTitle, artist: draftArtist || "Unknown artist", time: draftTime }]);
          setDraftTitle("");
          setDraftArtist("");
          setDraftTime("00:00");
        }}
        className="flex h-[52px] w-full items-center justify-center rounded-[999px] border border-dashed border-[#D9DDE7] text-[15px] font-medium text-[#16181D]"
      >
        <Plus className="mr-2 h-5 w-5" />
        Add cue point
      </button>
    </UploadPanel>
  );
}

function RenderTrailerDetails() {
  const [title, setTitle] = useState("Nairobi Nights - Official Trailer");
  const [relatedContent, setRelatedContent] = useState("Nairobi Nights Movie");
  const [genre, setGenre] = useState("Drama");
  const [releaseDate, setReleaseDate] = useState("27/03/2026");

  return (
    <UploadPanel title="Trailer details">
      <div>
        <FieldLabel required>Trailer title</FieldLabel>
        <TextField value={title} onChange={setTitle} />
      </div>
      <div>
        <FieldLabel required>Related content</FieldLabel>
        <SelectField value={relatedContent} onChange={setRelatedContent} options={["Nairobi Nights Movie", "Kings of Lagos", "Lagos After Dark"]} />
      </div>
      <TwoColFields
        left={
          <div>
            <FieldLabel required>Genre</FieldLabel>
            <SelectField value={genre} onChange={setGenre} options={["Drama", "Thriller", "Romance", "Comedy"]} />
          </div>
        }
        right={
          <div>
            <FieldLabel>Release date</FieldLabel>
            <TextField value={releaseDate} onChange={setReleaseDate} />
          </div>
        }
      />
    </UploadPanel>
  );
}

export const uploadPageConfigs: Record<UploadType, UploadPageConfig> = {
  movie: {
    label: "Movie",
    icon: "/assets/upload-page-assets/movie.svg",
    activeIcon: "/assets/upload-page-assets/movie-blue.svg",
    topSections: [
      {
        title: "Uploaded file",
        body: (
          <UploadPanel title="Uploaded file">
            <UploadedFileCard name="lagos-after-dark-final.mp4" meta="3.1 GB · MP4" />
          </UploadPanel>
        ),
      },
      { title: "Movie details", body: <RenderMovieDetails /> },
      { title: "Subtitles (SRT files)", body: <SubtitlePanel filename="lagos-after-dark-en.srt" /> },
    ],
    rightRail: (
      <>
        <PreviewCard title="Thumbnail" />
        <TrailerUrlPanel />
        <AccessVisibilityCard />
        <RequiredNotice text="Movie title and genre must be filled before processing can begin." />
      </>
    ),
    footerNotice: "Cancel",
  },
  series: {
    label: "Series",
    icon: "/assets/upload-page-assets/series.svg",
    activeIcon: "/assets/upload-page-assets/series-blue.svg",
    topSections: [
      {
        title: "Uploaded file",
        body: (
          <UploadPanel title="Uploaded file">
            <UploadedFileCard name="kings-of-lagos-s01e01.mp4" meta="3.1 GB · MP4" />
          </UploadPanel>
        ),
      },
      { title: "Series details", body: <RenderSeriesDetails /> },
      { title: "Subtitles (SRT files)", body: <SubtitlePanel filename="kings-of-lagos-s01e01-en.srt" /> },
    ],
    rightRail: (
      <>
        <PreviewCard title="Thumbnail" />
        <TrailerUrlPanel />
        <AccessVisibilityCard />
        <RequiredNotice text="Series title, season, episode number and genre are required before processing." />
      </>
    ),
    footerNotice: "Cancel",
  },
  album: {
    label: "Album",
    icon: "/assets/upload-page-assets/album.svg",
    activeIcon: "/assets/upload-page-assets/album-blue.svg",
    topSections: [
      { title: "Album details", body: <RenderAlbumDetails /> },
      { title: "Track list", body: <RenderTrackList /> },
    ],
    rightRail: (
      <>
        <PreviewCard title="Cover art" />
        <AccessVisibilityCard />
        <RequiredNotice text="Album title, artist and genre are required. At least one track with a file must be added before processing." />
      </>
    ),
    footerNotice: "Cancel",
  },
  mix: {
    label: "DJ mix",
    icon: "/assets/upload-page-assets/dj-mix.svg",
    activeIcon: "/assets/upload-page-assets/dj-mix-blue.svg",
    topSections: [
      {
        title: "Uploaded file",
        body: (
          <UploadPanel title="Uploaded file">
            <UploadedFileCard name="afrobeats-vibes-vol-3-full.mp3" meta="124 MB · MP3" />
          </UploadPanel>
        ),
      },
      { title: "Mix details", body: <RenderMixDetails /> },
      { title: "Track listing", body: <RenderCuePoints /> },
    ],
    rightRail: (
      <>
        <PreviewCard title="Cover art" />
        <AccessVisibilityCard subscription="Free" />
        <RequiredNotice text="Mix title, DJ name and genre are required before processing." />
      </>
    ),
    footerNotice: "Cancel",
  },
  trailer: {
    label: "Trailer",
    icon: "/assets/upload-page-assets/trailer.svg",
    activeIcon: "/assets/upload-page-assets/trailer-blue.svg",
    topSections: [
      {
        title: "Uploaded file",
        body: (
          <UploadPanel title="Uploaded file">
            <UploadedFileCard name="nairobi-nights-trailer.mp4" meta="410 MB · MP4" />
          </UploadPanel>
        ),
      },
      { title: "Trailer details", body: <RenderTrailerDetails /> },
      { title: "Subtitles (SRT files)", body: <SubtitlePanel filename="nairobi-trailer-en.srt" /> },
    ],
    rightRail: (
      <>
        <PreviewCard title="Thumbnail" />
        <AccessVisibilityCard />
        <RequiredNotice text="Trailer title, related content and genre must be filled before processing." />
      </>
    ),
    footerNotice: "Cancel",
  },
};

export function UploadTypeTab({
  type,
  active,
  onClick,
}: {
  type: UploadType;
  active: boolean;
  onClick: () => void;
}) {
  const config = uploadPageConfigs[type];

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-[42px] items-center gap-2 rounded-full border px-4 text-[14px] font-medium transition ${
        active
          ? "border-[#AFC0FF] bg-[#F4F6FF] text-[#3150FF]"
          : "border-[#E6E7EC] bg-white text-[#B3B7C0] hover:border-[#D7D8DF] hover:text-[#61646C]"
      }`}
    >
      <Image src={active ? config.activeIcon : config.icon} alt="" width={14} height={14} />
      {config.label}
    </button>
  );
}
