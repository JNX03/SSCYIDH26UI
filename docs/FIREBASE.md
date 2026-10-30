# Firebase development and testing

The multiplayer game uses Firebase Authentication and Realtime Database. The live backend is INDEX (`index-5a9bb`). A separate local project, `demo-design-gym`, is available for isolated development with `?emulator=1` on localhost.

## Requirements

- Node 24.12 or newer for the current Firebase rules test library. The ordinary local app and content tests can still use the existing Node runtime.
- JDK 21 or newer for the database emulator.
- `npm install` to install the pinned official Firebase SDK, CLI, and rules testing library.

The emulator runner can discover a supported Node installation under common fnm/nvm directories and launches it without changing your default Node version. For example, `fnm install 24` installs a supported Node alongside the current version.

Set `JAVA_HOME` to your JDK home. On Apple Silicon with a Homebrew JDK, this is typically `/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home`. A portable Eclipse Temurin archive works too; see [Adoptium’s archive installation instructions](https://adoptium.net/installation/archives/). Temporary tooling installed for this workspace is kept in the user cache, outside the source tree; the runner also recognizes its `java-home.txt` marker.

## Commands

```sh
npm run local                # Start/reuse the web app and local Firebase together
npm test                     # Content and application unit tests
npm run test:firebase        # Start clean emulators, execute rule tests, then shut down
npm run emulators            # Keep Auth and Realtime Database running for browser QA
npm run test:firebase:running # Run against emulators that are already running
```

The configured local endpoints are:

| Service | Local endpoint |
| --- | --- |
| Authentication | `127.0.0.1:9099` |
| Realtime Database | `127.0.0.1:9000` |
| Emulator UI | `http://127.0.0.1:4000` |

`test:firebase` deliberately uses the `demo-` project ID and only the Auth and Database emulators. It does not require a Google login and does not deploy rules or create cloud resources. First startup downloads the official emulator binaries to Firebase’s cache. Test user accounts and room data are disposable emulator data. The integration tests clear test rooms, so finish the rule test run before using the same emulator for a browser session.

The app enables emulator configuration only on `localhost` and `127.0.0.1` when `?emulator=1` is present; deployed origins never connect to these ports. Emulator ports bind to loopback. Use separate browser tabs on this computer for the host and players. Default cloud settings point to INDEX. Keep service-account keys and other credentials out of the repository.

See [Firebase’s official Emulator Suite guide](https://firebase.google.com/docs/emulator-suite/install_and_configure) for the CLI behavior and supported configuration.
