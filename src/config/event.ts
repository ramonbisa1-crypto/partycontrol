export const EVENT_CONFIG = {
  name: "Birthday Party",

  date: "2026-10-16",
  startTime: "19:00",
  timezone: "Europe/Zurich",

  dateLabel: "16. Oktober 2026",
  fullDateLabel: "Freitag, 16. Oktober 2026",

  locationName: "Stadthalle Dietikon UG",
  street: "Fondlistrasse 15",
  postalCode: "8953",
  city: "Dietikon",

  location: "Stadthalle Dietikon UG, Fondlistrasse 15, 8953 Dietikon",

  expectedGuests: 300,

  publicViews: {
    home: "home",
    music: "music",
    photos: "photos",
  },

  protectedViews: {
    dj: "dj",
  },
} as const;

export const EVENT_START = new Date(
  "2026-10-16T19:00:00+02:00"
);