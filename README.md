# Design Gym Live

A live visual design quiz with 191 original questions, a six-digit game PIN, timed answers, realtime rankings, animal sidekicks, and explanations that highlight the relevant design detail.

## Run

```sh
npm install
npm run dev
```

- Join: http://localhost:4173/
- Host: http://localhost:4173/host

The first page only joins games. Host setup is at `/host`. There are no standalone learning pages.

The game uses the **INDEX** Firebase project (`index-5a9bb`) with Realtime Database and anonymous Authentication. Browser Firebase configuration is public application metadata; no admin keys are included.

## Play

The host chooses a topic, question count, timer, room theme, and motion preference, then shares the PIN or join link. Players choose a nickname and animal sidekick. A submitted answer locks until the host reveals the result. A round ends automatically when all connected players answer or the timer expires. Only the host advances through the explanation, ranking, and next question.

Correct answers earn 500–1,000 points depending on response time. Incorrect and missing answers earn zero. The final scoreboard ranks actual players and shows a podium.

The default visual question pool contains 91 comparison exercises. The optional full pool adds 100 scenario questions. Topics include color theory, typography, UX principles, layout, accessibility, forms, components, and content.

## Music

The host lobby offers the requested [Kahoot Halloween recording](https://soundcloud.com/kahoot-lobby-music/halloween-original) through SoundCloud’s official embedded player. Press play to enable it; pause and mute controls remain available. Music pauses when the round starts. Player updates preserve the same iframe, so joining does not restart the track. Availability and browser playback permissions are controlled by SoundCloud.

## Test locally

```sh
npm test
npm run build
npm run local
```

`npm run local` starts or reuses the web app and local Firebase emulators. Add `?emulator=1` to a localhost URL to test the local backend. The default backend remains INDEX.

```sh
npm run test:firebase:running
```

The emulator suite uses Auth on 9099, Realtime Database on 9000, and its dashboard at http://127.0.0.1:4000. Firebase tooling requires Node 24.12+ and Java 21+; the runner discovers the supported installations configured for this workspace. See [Firebase development notes](docs/FIREBASE.md).

## Database rules

`database.rules.json` contains strict isolated game rules for emulator tests. `database.index.rules.json` is the INDEX deployment policy: it preserves the existing public read policy and access to `cold`, `connection`, and `vibration`, while game room writes, player identity, answer locking, scoring, and host controls use scoped rules. Existing sensor records are not changed.

`firebase.json` targets the INDEX policy. `firebase.local.json` targets strict local rules. The emulator runner always uses the `demo-design-gym` test project and never deploys cloud rules.

## Source and reference

Questions, explanations, diagrams, animal art, and implementation are original. The subject coverage and visual comparison approach draw ideas from [Uxcel’s UX Design Foundations](https://uxcel.com/courses/design-foundations). This game is independent of Uxcel and Kahoot.
