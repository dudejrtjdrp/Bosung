# WebXR Gaussian Viewer (Starter)

Minimal starter for a WebXR-ready React viewer using Three.js and react-three-fiber.

Quick start:

1. Install dependencies

```bash
npm install
```

2. Dev server

```bash
npm run dev
```

Notes:
- Place your PLY exports under `public/models/` (create the folder) and update the `url` prop passed to `GaussianLoader` in [src/components/Scene.jsx](src/components/Scene.jsx).
- `GaussianLoader` currently renders the PLY as `points`. For Gaussian Splatting rendering you'll replace the material with a splat shader or specialized renderer.

WebXR / VR testing
- This project supports WebXR via the Three.js `VRButton`. The renderer is enabled for XR in the Canvas `onCreated` handler and a VR entry button is added to the page.
- Notes for testing on Meta Quest / Quest Browser:
	- WebXR requires a secure context (HTTPS) unless you use `localhost`. If you want to open the dev server from the Quest browser, expose it over HTTPS (for example, with `ngrok`) or host on an HTTPS-enabled URL.
	- Example using `ngrok`:

```bash
# start Vite dev server
npm run dev

# in another terminal, expose the port (3000 default)
ngrok http 3000
```

Open the HTTPS ngrok URL on the Quest browser, then tap the `Enter VR` button to start an immersive session.

If you test from a device on the same LAN via IP (e.g. `http://192.168.1.x:3000`), WebXR immersive sessions will usually require HTTPS — use `ngrok` or a reverse-proxy with TLS for a smooth test flow.
