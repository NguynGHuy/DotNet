import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from "@microsoft/signalr";

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5038/api";

const serverUrl = apiUrl.replace(/\/api\/?$/, "").replace(/\/$/, "");

const hubUrl = `${serverUrl}/hubs/thong-bao`;

let connection: HubConnection | null = null;
let startPromise: Promise<HubConnection | null> | null = null;
let stopPromise: Promise<void> | null = null;
let startingToken: string | null = null;
let connectedToken: string | null = null;

export function getNotificationConnection(): HubConnection {
  if (!connection) {
    connection = new HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () => localStorage.getItem("token") || "",
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000])
      .configureLogging(LogLevel.Warning)
      .build();

    connection.onreconnecting(() => {
      console.log("SignalR đang kết nối lại...");
    });

    connection.onreconnected(() => {
      connectedToken = localStorage.getItem("token");

      console.log("SignalR đã kết nối lại.");
    });

    connection.onclose(() => {
      connectedToken = null;
      console.log("SignalR đã ngắt kết nối.");
    });
  }

  return connection;
}

export async function startNotificationConnection(): Promise<HubConnection | null> {
  if (stopPromise) {
    await stopPromise;
  }

  const token = localStorage.getItem("token");

  if (!token) {
    return null;
  }

  const hub = getNotificationConnection();

  if (hub.state === HubConnectionState.Connected && connectedToken === token) {
    return hub;
  }

  if (startPromise) {
    if (startingToken === token) {
      return startPromise;
    }

    await startPromise;
  }

  if (
    hub.state !== HubConnectionState.Disconnected &&
    connectedToken !== token
  ) {
    await stopNotificationConnection();
  }

  if (hub.state === HubConnectionState.Connected) {
    return hub;
  }

  if (
    hub.state === HubConnectionState.Connecting ||
    hub.state === HubConnectionState.Reconnecting
  ) {
    return hub;
  }

  startingToken = token;

  startPromise = hub
    .start()
    .then(() => {
      connectedToken = token;
      console.log("SignalR đã kết nối.");
      return hub;
    })
    .catch((error) => {
      connectedToken = null;

      console.error("Không thể kết nối SignalR:", error);

      return null;
    })
    .finally(() => {
      startPromise = null;
      startingToken = null;
    });

  return startPromise;
}

export async function stopNotificationConnection(): Promise<void> {
  if (stopPromise) {
    return stopPromise;
  }

  const hub = connection;

  stopPromise = (async () => {
    try {
      const pendingStart = startPromise;

      if (pendingStart) {
        await pendingStart;
      }

      if (hub && hub.state !== HubConnectionState.Disconnected) {
        await hub.stop();
      }
    } catch (error) {
      console.error("Không thể ngắt kết nối SignalR:", error);
    } finally {
      connectedToken = null;
      startingToken = null;
      startPromise = null;
      stopPromise = null;
    }
  })();

  return stopPromise;
}
