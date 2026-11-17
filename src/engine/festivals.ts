// Festivals and fasting days the family can choose to plan for.
// Dates are for India (Smarta days as listed by Drik Panchang, New Delhi), Nov 2026 to Dec 2027.
// Some families keep a festival a day earlier or later, so people tick the days themselves.
// Add the next year's dates here before December 2027.

import type { FamilyProfile, FestivalDay, FestivalRule } from './types';
import { addDays, parseISODate, toISODate } from './util';

export interface Festival {
  id: string;
  name: string;
  hindi: string;
  /** What most families change in the food, offered first */
  rule: FestivalRule;
  /** One short line shown with the festival */
  note: string;
  dates: string[];
}

/** Every date from `from` to `to`, both included (YYYY-MM-DD). */
function span(from: string, to: string): string[] {
  const out: string[] = [];
  for (let d = parseISODate(from); toISODate(d) <= to; d = addDays(d, 1)) out.push(toISODate(d));
  return out;
}

export const FESTIVALS: Festival[] = [
  {
    id: 'ekadashi',
    name: 'Ekadashi',
    hindi: 'एकादशी',
    rule: 'vrat',
    note: 'Twice a month. No grains or rice; vrat food all day.',
    dates: [
      '2026-12-04', '2026-12-20', '2027-01-03', '2027-01-18', '2027-02-02', '2027-02-17', '2027-03-04', '2027-03-18',
      '2027-04-02', '2027-04-17', '2027-05-02', '2027-05-16', '2027-06-01', '2027-06-14', '2027-06-30', '2027-07-14',
      '2027-07-29', '2027-08-12', '2027-08-28', '2027-09-11', '2027-09-26', '2027-10-11', '2027-10-25', '2027-11-10',
      '2027-11-24', '2027-12-09', '2027-12-23',
    ],
  },
  {
    id: 'maha-shivratri',
    name: 'Maha Shivratri',
    hindi: 'महाशिवरात्रि',
    rule: 'vrat',
    note: 'Vrat food all day.',
    dates: ['2027-03-06'],
  },
  {
    id: 'chaitra-navratri',
    name: 'Chaitra Navratri',
    hindi: 'चैत्र नवरात्रि',
    rule: 'vrat',
    note: 'Nine days, ending on Ram Navami. Some families fast only on the first and last day.',
    dates: span('2027-04-07', '2027-04-15'),
  },
  {
    id: 'sawan-somwar',
    name: 'Sawan Somwar',
    hindi: 'सावन सोमवार',
    rule: 'vrat',
    note: 'Mondays of Sawan (North India dates). In Maharashtra, Gujarat and the South, Shravan starts about two weeks later.',
    dates: ['2027-07-19', '2027-07-26', '2027-08-02', '2027-08-09', '2027-08-16'],
  },
  {
    id: 'janmashtami',
    name: 'Janmashtami',
    hindi: 'जन्माष्टमी',
    rule: 'vrat',
    note: 'Vrat food till the midnight puja. Some families keep it on 24 August.',
    dates: ['2027-08-25'],
  },
  {
    id: 'paryushan',
    name: 'Paryushan',
    hindi: 'पर्युषण',
    rule: 'jain',
    note: 'Shwetambar Jain dates, ending on Samvatsari. Strict Jain food.',
    dates: span('2027-08-28', '2027-09-04'),
  },
  {
    id: 'das-lakshan',
    name: 'Das Lakshan',
    hindi: 'दसलक्षण',
    rule: 'jain',
    note: 'Digambar Jain dates. Strict Jain food.',
    dates: span('2027-09-05', '2027-09-14'),
  },
  {
    id: 'sharad-navratri',
    name: 'Sharad Navratri',
    hindi: 'शारदीय नवरात्रि',
    rule: 'vrat',
    note: 'Navratri before Dussehra. Some families fast only on the first and last day.',
    dates: span('2027-09-30', '2027-10-09'),
  },
  {
    id: 'karwa-chauth',
    name: 'Karwa Chauth',
    hindi: 'करवा चौथ',
    rule: 'satvik',
    note: 'The fast is kept till moonrise; the family’s food stays simple and satvik.',
    dates: ['2027-10-18'],
  },
];

export function getFestival(id: string): Festival | undefined {
  return FESTIVALS.find((f) => f.id === id);
}

export const RULE_LABEL: Record<FestivalRule, string> = {
  vrat: 'Vrat food all day',
  satvik: 'Satvik: no onion or garlic',
  jain: 'Jain food',
};

/** Festivals with at least one date from `from` up to `days` days later, soonest first. */
export function upcomingFestivals(from: string, days: number): { festival: Festival; dates: string[] }[] {
  const to = toISODate(addDays(parseISODate(from), days));
  return FESTIVALS.map((festival) => ({ festival, dates: festival.dates.filter((d) => d >= from && d <= to) }))
    .filter((x) => x.dates.length)
    .sort((a, b) => a.dates[0].localeCompare(b.dates[0]));
}

/** The family's festival plan for a date, if any. */
export function festivalOn(profile: FamilyProfile, date: string): FestivalDay | undefined {
  return profile.festivalDays?.find((f) => f.date === date);
}

/**
 * Save which of a festival's days the family keeps, and the food rule for them.
 * `offered` are the dates the person saw; only those are changed, so other plans stay.
 */
export function planFestival(profile: FamilyProfile, festivalId: string, offered: string[], chosen: string[], rule: FestivalRule): FamilyProfile {
  const keep = (profile.festivalDays ?? []).filter((f) => !(f.festival === festivalId && offered.includes(f.date)) && !chosen.includes(f.date));
  const added = chosen.map((date): FestivalDay => ({ date, festival: festivalId, rule }));
  const festivalDays = [...keep, ...added].sort((a, b) => a.date.localeCompare(b.date));
  return { ...profile, festivalDays };
}
