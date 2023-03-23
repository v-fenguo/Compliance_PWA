importScripts(
    'https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-sw.js'
);

// This is your Service Worker, you can put any of your custom Service Worker
// code in this file, above the `precacheAndRoute` line.

workbox.precaching.precacheAndRoute(self.__WB_MANIFEST || []);

const WIDGET_TAG = 'caaspwa';

// Listen to the widgetinstall event.
self.addEventListener("widgetinstall", event => {
    // The widget just got installed, render it using renderWidget.
    // Pass the event.widget object to the function.
    event.waitUntil(renderWidget(event.widget));
  });

  async function renderWidget(widget) {
    // Get the template and data URLs from the widget definition.
    const templateUrl = widget.definition.msAcTemplate;
    const dataUrl = widget.definition.data;

    // Fetch the template text and data.
    const template = await (await fetch(templateUrl)).text();
    const data = await (await fetch(dataUrl)).text();

    // Render the widget with the template and data.
    await self.widgets.updateByTag(widget.definition.tag, {template, data});
  }

  // Update the widgets to their initial states
// when the service worker is activated.
self.addEventListener("activate", event => {
    event.waitUntil(updateWidgets());
  });

  async function updateWidgets() {
    // Get the widget that match the tag defined in the web app manifest.
    const widget = await self.widgets.getByTag(WIDGET_TAG);
    if (!widget) {
      return;
    }

    // Using the widget definition, get the template and data.
    const template = await (await fetch(widget.definition.msAcTemplate)).text();
    const data = await (await fetch(widget.definition.data)).text();

    // Render the widget with the template and data.
    await self.widgets.updateByTag(widget.definition.tag, {template, data});
  }

  self.addEventListener("widgetinstall", event => {
    event.waitUntil(onWidgetInstall(event.widget));
  });

  self.addEventListener("widgetuninstall", event => {
    event.waitUntil(onWidgetUninstall(event.widget));
  });

  async function onWidgetInstall(widget) {
    // Register a periodic sync, if this wasn't done already.
    // We use the same tag for the sync registration and the widget to
    // avoid registering several periodic syncs for the same widget.
    const tags = await self.registration.periodicSync.getTags();
    if (!tags.includes(widget.definition.tag)) {
      await self.registration.periodicSync.register(widget.definition.tag, {
        minInterval: widget.definition.update
      });
    }

    // And also update the instance.
    await updateWidget(widget);
  }

  async function onWidgetUninstall(widget) {
    // On uninstall, unregister the periodic sync.
    // If this was the last widget instance, then unregister the periodic sync.
    if (widget.instances.length === 1 && "update" in widget.definition) {
      await self.registration.periodicSync.unregister(widget.definition.tag);
    }
  }

  // Listen to periodicsync events to update all widget instances
  // periodically.
  self.addEventListener("periodicsync", async event => {
    const widget = await self.widgets.getByTag(event.tag);

    if (widget && "update" in widget.definition) {
      event.waitUntil(updateWidget(widget));
    }
  });

  async function updateWidget(widget) {
    // Get the template and data URLs from the widget definition.
    const templateUrl = widget.definition.msAcTemplate;
    const dataUrl = widget.definition.data;

    // Fetch the template text and data.
    const template = await (await fetch(templateUrl)).text();
    const data = await (await fetch(dataUrl)).text();

    // Render the widget with the template and data.
    await self.widgets.updateByTag(widget.definition.tag, {template, data});
  }