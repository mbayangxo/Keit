import { useState } from 'react';
import { Animated, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PressScale from '../components/PressScale';
import { colors, fontFamily, radius, spacing, type } from '../theme';
import { useEntrance, useBlink, useScalePulse } from '../hooks/animations';

// design/k21-complete-redesign.html Discover/Eat/Events sections, merged
// into one tabbed hub matching the Phase 1 scope (events, tickets, merchant
// discovery, flash deals) plus Culture and Gigs/Hustle from the brief's
// app structure. Défis and Ataya tiles from the original Discover grid are
// swapped for in-scope content (Phase 1 excludes both).

const TABS = ['Tout', 'Culture', 'Eat', 'Gigs', 'Events'];

const DISCOVER_GRID = [
  { key: 'concert', wide: true, bg: ['#0a1f0a', '#020a02'], icon: '🎤', cat: 'CE SOIR', catColor: colors.green, title: 'Soirée Mbalax — Saliou K.', meta: 'Place de l’Obélisque · Gratuit K21', live: true },
  { key: 'chart', bg: ['#1a1000', '#0a0800'], icon: '🎵', cat: 'Chart 221', catColor: colors.flagGold, title: '"Yëkël" #1', meta: 'Saliou K.' },
  { key: 'flash', bg: ['#001a08', '#000a04'], icon: '🍖', cat: 'Flash deal', catColor: colors.green, title: '-30% Dibiterie', meta: 'Expire dans 2h ⏱️' },
  { key: 'merchant', bg: ['#1a0008', '#0a0004'], icon: '🏬', cat: 'Marchand', catColor: colors.flagRed, title: 'Sandaga Market', meta: '1 200 K21 payments', live: true },
  { key: 'gig', bg: ['#0a0a1a', '#04040a'], icon: '💼', cat: 'Gig', catColor: colors.flagGold, title: 'Livreur weekend', meta: '5 000 F/jour' },
  { key: 'event', bg: ['#1a0800', '#0a0400'], icon: '🌙', cat: 'Event', catColor: colors.orange, title: 'Concert ce soir', meta: 'Médina · Gratuit' },
];

const FLASH_DEALS = [
  { key: 'dibiterie', bg: ['#1a0800', '#0a0400'], icon: '🍖', discount: '-30%', name: 'Dibiterie Papa', price: '1 400 F', old: '2 000 F', time: '⏱ 2h restantes' },
  { key: 'yassa', bg: ['#001a0a', '#000a05'], icon: '🍚', discount: '-20%', name: 'Thiébou Yassa', price: '2 000 F', old: '2 500 F', time: '⏱ 4h restantes' },
  { key: 'cafe', bg: ['#1a1a00', '#0a0a00'], icon: '☕', discount: '-15%', name: 'Café Touba', price: '425 F', old: '500 F', time: '⏱ Toute la journée' },
  { key: 'salade', bg: ['#1a001a', '#0a000a'], icon: '🥗', discount: '-25%', name: 'Salade Médina', price: '1 500 F', old: '2 000 F', time: '⏱ 1h restante' },
];

const RESTAURANTS = [
  { key: 'papa', bg: ['#1a0800', '#0a0400'], icon: '🍖', name: 'Chez Papa', meta: 'Dibiterie · 200m', rating: '4.8' },
  { key: 'coura', bg: ['#001a0a', '#000a05'], icon: '🍚', name: 'Mame Coura', meta: 'Thiébou · 350m', rating: '4.6' },
  { key: 'yassahouse', bg: ['#1a0a00', '#0a0500'], icon: '🌯', name: 'Yassa House', meta: 'Poulet · 500m', rating: '4.5' },
  { key: 'ataya', bg: ['#0a001a', '#05000a'], icon: '☕', name: 'Salon Ataya', meta: 'Café · 100m', rating: '4.9' },
];

const EVENTS_LIST = [
  { key: 'freestyle', day: '15', mon: 'Mar', title: 'Freestyle Grand Prix', meta: '🏆 UCAD · 14h · 2 847 participants', price: 'Participer — Gratuit K21' },
  { key: 'afcon', day: '18', mon: 'Mar', title: 'Sénégal vs Mali · AFCON 2026', meta: '⚽ Léopold Sédar Senghor · 17h', price: 'Billets — 5 000 F via K21' },
  { key: 'mbalax', day: '22', mon: 'Mar', title: 'Nuit du Mbalax — Parcelles', meta: '🎵 Espace Lamantin · 21h', price: '3 000 F · -20% K21 Pass' },
];

const CULTURE_FIXTURES = [
  { key: 'can', icon: '⚽', title: 'Sénégal vs Mali', meta: 'AFCON 2026 · 18 Mars · 17h', tag: 'Sport' },
  { key: 'basket', icon: '🏀', title: 'AS Douanes vs Jaraaf', meta: 'Basket · Dakar Arena · 20h', tag: 'Sport' },
  { key: 'expo', icon: '🎨', title: 'Expo Art Contemporain', meta: 'IFAN Musée · Toute la semaine', tag: 'Culture' },
  { key: 'lutte', icon: '🤼', title: 'Gala de Lutte — Arène Nationale', meta: '25 Mars · 16h', tag: 'Sport' },
];

const GIGS = [
  { key: 'livreur', icon: '🛵', title: 'Livreur weekend', meta: 'Médina · Flexible', pay: '5 000 F/jour' },
  { key: 'photo', icon: '📸', title: 'Photographe événementiel', meta: 'Freelance · Ponctuel', pay: '15 000 F/event' },
  { key: 'demenagement', icon: '📦', title: 'Aide déménagement', meta: 'Plateau · Ce weekend', pay: '3 000 F/h' },
  { key: 'cours', icon: '📚', title: 'Cours de maths niveau lycée', meta: 'À domicile · Récurrent', pay: '2 000 F/h' },
];

function Pill({ label, active, onPress }) {
  return (
    <PressScale scaleTo={0.94} onPress={onPress} style={[styles.pill, active && styles.pillOn]}>
      <Text style={[styles.pillText, active && styles.pillTextOn]}>{label}</Text>
    </PressScale>
  );
}

function GridTile({ item, delay }) {
  const entrance = useEntrance(delay, 350, 8);
  const liveDot = useBlink(1000, 0.3);
  return (
    <Animated.View style={[styles.dgItem, item.wide && styles.dgItemWide, entrance, { backgroundColor: item.bg[0] }]}>
      <Text style={styles.dgBg}>{item.icon}</Text>
      <View style={styles.dgOverlay} />
      {item.live && <Animated.View style={[styles.dgLiveDot, { opacity: liveDot }]} />}
      <View style={styles.dgBody}>
        <Text style={[styles.dgCat, { color: item.catColor }]}>{item.cat}</Text>
        <Text style={styles.dgTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.dgMeta}>{item.meta}</Text>
      </View>
    </Animated.View>
  );
}

function AllTab() {
  return (
    <View style={styles.discGrid}>
      {DISCOVER_GRID.map((item, i) => (
        <GridTile key={item.key} item={item} delay={i * 50} />
      ))}
    </View>
  );
}

function FlashCard({ item, delay }) {
  const entrance = useEntrance(delay, 350, 10);
  const discPulse = useScalePulse(1500, 1.08);
  return (
    <Animated.View style={[styles.flashCard, entrance]}>
      <View style={[styles.fcImg, { backgroundColor: item.bg[0] }]}>
        <Text style={{ fontSize: 34 }}>{item.icon}</Text>
        <Animated.View style={[styles.fcDiscount, { transform: [{ scale: discPulse }] }]}>
          <Text style={styles.fcDiscountText}>{item.discount}</Text>
        </Animated.View>
      </View>
      <View style={styles.fcBody}>
        <Text style={styles.fcName}>{item.name}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <Text style={styles.fcNew}>{item.price}</Text>
          <Text style={styles.fcOld}>{item.old}</Text>
        </View>
        <Text style={styles.fcTime}>{item.time}</Text>
      </View>
    </Animated.View>
  );
}

function RestaurantCard({ item, delay }) {
  const entrance = useEntrance(delay, 350, 10);
  return (
    <Animated.View style={[styles.rgItem, entrance]}>
      <View style={[styles.rgImg, { backgroundColor: item.bg[0] }]}>
        <Text style={{ fontSize: 30 }}>{item.icon}</Text>
      </View>
      <View style={styles.rgBody}>
        <Text style={styles.rgName}>{item.name}</Text>
        <Text style={styles.rgMeta}>{item.meta}</Text>
        <Text style={styles.rgRating}>⭐ {item.rating}</Text>
      </View>
    </Animated.View>
  );
}

function EatTab() {
  const flashTimer = useBlink(1000, 0.6);
  return (
    <View>
      <View style={styles.flashLabelRow}>
        <Text style={styles.flTitle}>⚡ FLASH DEALS</Text>
        <Animated.View style={[styles.flTimer, { opacity: flashTimer }]}>
          <Text style={styles.flTimerText}>02:14:33</Text>
        </Animated.View>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.flashCarousel}>
        {FLASH_DEALS.map((item, i) => (
          <FlashCard key={item.key} item={item} delay={i * 50} />
        ))}
      </ScrollView>

      <View style={styles.restSection}>
        <Text style={styles.restLabel}>Restaurants près de toi</Text>
        <View style={styles.restGrid}>
          {RESTAURANTS.map((item, i) => (
            <RestaurantCard key={item.key} item={item} delay={i * 60} />
          ))}
        </View>
      </View>
    </View>
  );
}

function EventHeroCard() {
  const liveDot = useBlink(1000, 0.3);
  const entrance = useEntrance(0, 450, 10);
  return (
    <Animated.View style={[styles.ehcCard, entrance]}>
      <Text style={styles.ehcBg}>🎤</Text>
      <View style={styles.ehcOverlay} />
      <View style={styles.ehcLive}>
        <Animated.View style={[styles.ldDot, { opacity: liveDot }]} />
        <Text style={styles.ehcLiveText}>CE SOIR</Text>
      </View>
      <View style={styles.ehcBody}>
        <Text style={styles.ehcCat}>Concert · Médina</Text>
        <Text style={styles.ehcTitle}>Soirée Mbalax — Saliou K. en live</Text>
        <View style={styles.ehcMetaRow}>
          <Text style={styles.ehcMeta}>🕗 20h · Place de l'Obélisque</Text>
          <View style={styles.ehcPrice}>
            <Text style={styles.ehcPriceText}>Gratuit K21</Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

function EventRow({ item, delay }) {
  const entrance = useEntrance(delay, 350, 8);
  return (
    <Animated.View style={[styles.evItem, entrance]}>
      <View style={styles.evDateBox}>
        <Text style={styles.evdDay}>{item.day}</Text>
        <Text style={styles.evdMon}>{item.mon}</Text>
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.evTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.evMeta}>{item.meta}</Text>
        <Text style={styles.evPrice}>{item.price}</Text>
      </View>
      <PressScale scaleTo={0.9} style={styles.evGoing}>
        <Text style={{ fontSize: 12 }}>🎟️</Text>
      </PressScale>
    </Animated.View>
  );
}

function EventsTab() {
  return (
    <View>
      <EventHeroCard />
      <View style={styles.eventList}>
        {EVENTS_LIST.map((item, i) => (
          <EventRow key={item.key} item={item} delay={i * 60} />
        ))}
      </View>
    </View>
  );
}

function ListRow({ icon, title, meta, tag, tagColor, delay }) {
  const entrance = useEntrance(delay, 350, 8);
  return (
    <Animated.View style={[styles.listRow, entrance]}>
      <View style={styles.listIcon}>
        <Text style={{ fontSize: 20 }}>{icon}</Text>
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.listTitle} numberOfLines={1}>{title}</Text>
        <Text style={styles.listMeta}>{meta}</Text>
      </View>
      {tag && (
        <View style={[styles.listTag, { backgroundColor: `${tagColor}20`, borderColor: `${tagColor}40` }]}>
          <Text style={[styles.listTagText, { color: tagColor }]}>{tag}</Text>
        </View>
      )}
    </Animated.View>
  );
}

function CultureTab() {
  return (
    <View style={{ paddingHorizontal: spacing.huge, paddingTop: spacing.lg, gap: spacing.sm }}>
      <Text style={styles.sectionLabel}>Sport & Culture</Text>
      {CULTURE_FIXTURES.map((item, i) => (
        <ListRow
          key={item.key}
          icon={item.icon}
          title={item.title}
          meta={item.meta}
          tag={item.tag}
          tagColor={item.tag === 'Sport' ? colors.green : colors.flagGold}
          delay={i * 60}
        />
      ))}
    </View>
  );
}

function GigsTab() {
  return (
    <View style={{ paddingHorizontal: spacing.huge, paddingTop: spacing.lg, gap: spacing.sm }}>
      <Text style={styles.sectionLabel}>Gigs & Hustle près de toi</Text>
      {GIGS.map((item, i) => (
        <ListRow key={item.key} icon={item.icon} title={item.title} meta={item.meta} tag={item.pay} tagColor={colors.green} delay={i * 60} />
      ))}
    </View>
  );
}

export default function DiscoverScreen() {
  const [tab, setTab] = useState('Tout');

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={styles.hero}>
          <View style={styles.searchRow}>
            <Text style={styles.searchText}>🔍 Chercher...</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillsRow}>
            {TABS.map((label) => (
              <Pill key={label} label={label} active={tab === label} onPress={() => setTab(label)} />
            ))}
          </ScrollView>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: spacing.giant }} showsVerticalScrollIndicator={false}>
          {tab === 'Tout' && <AllTab />}
          {tab === 'Culture' && <CultureTab />}
          {tab === 'Eat' && <EatTab />}
          {tab === 'Gigs' && <GigsTab />}
          {tab === 'Events' && <EventsTab />}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ink },

  hero: { paddingHorizontal: 15, paddingTop: spacing.xl, backgroundColor: 'rgba(255,100,34,0.06)', borderBottomWidth: 1, borderBottomColor: colors.orangeA10 },
  searchRow: { height: 36, maxWidth: 180, backgroundColor: colors.whiteA06, borderWidth: 1.5, borderColor: colors.whiteA10, borderRadius: radius.round, justifyContent: 'center', paddingHorizontal: spacing.xl, marginBottom: spacing.xl },
  searchText: { fontSize: 11, color: colors.whiteA30 },
  pillsRow: { gap: 7, paddingBottom: spacing.xl },

  pill: { height: 32, paddingHorizontal: spacing.xxl, borderRadius: radius.round, backgroundColor: colors.whiteA08, alignItems: 'center', justifyContent: 'center' },
  pillOn: { backgroundColor: colors.orange },
  pillText: { fontFamily: fontFamily.bodyBold, fontSize: 10, color: colors.whiteA55 },
  pillTextOn: { color: colors.ink },

  discGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: spacing.xxl, paddingTop: spacing.lg, gap: spacing.md },
  dgItem: { width: '48.5%', aspectRatio: 1, borderRadius: radius.xxl, overflow: 'hidden', justifyContent: 'flex-end', position: 'relative' },
  dgItemWide: { width: '100%', aspectRatio: 2 },
  dgBg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, fontSize: 44, textAlign: 'center', textAlignVertical: 'center' },
  dgOverlay: { position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.35)' },
  dgLiveDot: { position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: 4, backgroundColor: colors.flagRed, borderWidth: 2, borderColor: 'rgba(0,0,0,0.3)' },
  dgBody: { padding: 9 },
  dgCat: { fontSize: 7, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2, opacity: 0.9 },
  dgTitle: { fontSize: 11, fontWeight: '700', color: colors.white, lineHeight: 14 },
  dgMeta: { fontSize: 8, color: colors.whiteA70, marginTop: 2 },

  flashLabelRow: { paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.lg, marginBottom: spacing.md },
  flTitle: { fontSize: 8, fontWeight: '700', letterSpacing: 1.5, color: colors.whiteA30, textTransform: 'uppercase' },
  flTimer: { backgroundColor: colors.redA06, borderWidth: 1, borderColor: 'rgba(232,25,44,0.3)', borderRadius: radius.round, paddingHorizontal: spacing.lg, paddingVertical: 3 },
  flTimerText: { fontSize: 9, fontWeight: '700', color: colors.flagRed },
  flashCarousel: { gap: 9, paddingHorizontal: 15, paddingBottom: spacing.xl },
  flashCard: { width: 130, borderRadius: radius.xxxl - 3, overflow: 'hidden', backgroundColor: colors.whiteA06, borderWidth: 1.5, borderColor: colors.whiteA10 },
  fcImg: { height: 72, alignItems: 'center', justifyContent: 'center' },
  fcDiscount: { position: 'absolute', top: 6, left: 6, backgroundColor: colors.flagRed, borderRadius: 7, paddingHorizontal: spacing.md, paddingVertical: 2 },
  fcDiscountText: { fontFamily: fontFamily.displayBlack, fontSize: 9, color: colors.white },
  fcBody: { padding: 9 },
  fcName: { fontSize: 10, fontWeight: '700', color: colors.white, marginBottom: 2 },
  fcNew: { fontSize: 11, fontWeight: '700', color: colors.green },
  fcOld: { fontSize: 9, color: colors.whiteA30, textDecorationLine: 'line-through' },
  fcTime: { fontSize: 8, color: colors.flagRed, marginTop: 3, fontWeight: '600' },

  restSection: { paddingHorizontal: 15, paddingTop: spacing.lg },
  restLabel: { fontSize: 8, fontWeight: '700', letterSpacing: 1.5, color: colors.whiteA30, textTransform: 'uppercase', marginBottom: spacing.lg },
  restGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  rgItem: { width: '48.5%', backgroundColor: colors.whiteA06, borderWidth: 1, borderColor: colors.whiteA08, borderRadius: radius.xl, overflow: 'hidden' },
  rgImg: { height: 58, alignItems: 'center', justifyContent: 'center' },
  rgBody: { padding: 9 },
  rgName: { fontSize: 11, fontWeight: '700', color: colors.white, marginBottom: 2 },
  rgMeta: { fontSize: 9, color: colors.whiteA35 },
  rgRating: { color: colors.flagGold, fontSize: 9, fontWeight: '700', marginTop: 2 },

  ehcCard: { marginHorizontal: 14, marginTop: spacing.lg, marginBottom: spacing.lg, borderRadius: radius.xxxl + 2, overflow: 'hidden', height: 140, position: 'relative', backgroundColor: '#0a1a0c' },
  ehcBg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, fontSize: 72, textAlign: 'center', textAlignVertical: 'center' },
  ehcOverlay: { position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)' },
  ehcLive: { position: 'absolute', top: 10, left: 10, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.flagRed, borderRadius: radius.round, paddingHorizontal: spacing.md, paddingVertical: 3 },
  ldDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: colors.white },
  ehcLiveText: { fontSize: 8, fontWeight: '700', color: colors.white },
  ehcBody: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: spacing.xl },
  ehcCat: { fontSize: 7, fontWeight: '700', color: colors.green, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 },
  ehcTitle: { fontSize: 13, fontWeight: '700', color: colors.white, lineHeight: 17, marginBottom: 4 },
  ehcMetaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  ehcMeta: { fontSize: 9, color: colors.whiteA70 },
  ehcPrice: { backgroundColor: colors.green, borderRadius: radius.round, paddingHorizontal: spacing.md, paddingVertical: 2 },
  ehcPriceText: { fontSize: 9, fontWeight: '700', color: colors.ink },

  eventList: { paddingHorizontal: 14, paddingBottom: spacing.xxxl, gap: spacing.md },
  evItem: { flexDirection: 'row', gap: spacing.lg, backgroundColor: colors.whiteA06, borderWidth: 1, borderColor: colors.whiteA08, borderRadius: radius.xl, padding: spacing.xl },
  evDateBox: { width: 40, backgroundColor: colors.greenA08, borderWidth: 1, borderColor: colors.greenA18, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.md },
  evdDay: { fontFamily: fontFamily.displayBlack, fontSize: 16, color: colors.green, lineHeight: 16 },
  evdMon: { fontSize: 7, fontWeight: '700', color: 'rgba(26,240,96,0.6)', textTransform: 'uppercase' },
  evTitle: { fontSize: 12, fontWeight: '700', color: colors.white },
  evMeta: { fontSize: 9, color: colors.whiteA35, marginTop: 2 },
  evPrice: { fontSize: 10, fontWeight: '700', color: colors.flagGold, marginTop: 3 },
  evGoing: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.greenA10, borderWidth: 1.5, borderColor: colors.greenA25, alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },

  sectionLabel: { ...type.eyebrow, color: colors.whiteA30, marginBottom: spacing.sm },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, backgroundColor: colors.whiteA04, borderWidth: 1, borderColor: colors.whiteA06, borderRadius: radius.lg, padding: spacing.xl },
  listIcon: { width: 40, height: 40, borderRadius: radius.lg, backgroundColor: colors.whiteA06, alignItems: 'center', justifyContent: 'center' },
  listTitle: { fontFamily: fontFamily.bodyBold, fontSize: 13, color: colors.white },
  listMeta: { fontSize: 10, color: colors.whiteA35, marginTop: 2 },
  listTag: { borderWidth: 1, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: 4 },
  listTagText: { fontSize: 9, fontWeight: '700' },
});
