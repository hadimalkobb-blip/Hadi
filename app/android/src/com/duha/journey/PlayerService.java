package com.duha.journey;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.res.AssetFileDescriptor;
import android.media.AudioAttributes;
import android.media.AudioFocusRequest;
import android.media.AudioManager;
import android.media.MediaMetadata;
import android.media.MediaPlayer;
import android.media.session.MediaSession;
import android.media.session.PlaybackState;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.PowerManager;
import org.json.JSONArray;
import org.json.JSONObject;

public class PlayerService extends Service {
    private static final String CH = "player";
    static PlayerService live;
    private AudioFocusRequest afr;
    private AudioManager am;
    private int endMs;
    private boolean focusPaused;
    private boolean inGap;
    private boolean loop;
    private MediaPlayer mp;
    private MediaSession ms;
    private boolean paused;
    private long sleepAt;
    private PowerManager.WakeLock wl;
    private final Handler h = new Handler(Looper.getMainLooper());
    private JSONArray items = new JSONArray();
    private int idx = -1;
    private float rate = 1.0f;
    private String reciter = "";
    private final Runnable tick = new Runnable() { // from class: com.duha.journey.PlayerService.1
        @Override // java.lang.Runnable
        public void run() {
            if (PlayerService.this.mp == null || PlayerService.this.paused || PlayerService.this.inGap) {
                return;
            }
            try {
                if (PlayerService.this.mp.getCurrentPosition() >= PlayerService.this.endMs) {
                    PlayerService.this.mp.pause();
                    PlayerService.this.gapThenNext();
                    return;
                }
            } catch (Exception unused) {
            }
            PlayerService.this.h.postDelayed(this, 40L);
        }
    };
    private final Runnable next = new Runnable() { // from class: com.duha.journey.PlayerService.2
        @Override // java.lang.Runnable
        public void run() {
            PlayerService.this.inGap = false;
            PlayerService playerService = PlayerService.this;
            playerService.play(playerService.idx + 1);
        }
    };
    private final BroadcastReceiver noisy = new BroadcastReceiver() { // from class: com.duha.journey.PlayerService.3
        @Override // android.content.BroadcastReceiver
        public void onReceive(Context context, Intent intent) {
            if ("android.media.AUDIO_BECOMING_NOISY".equals(intent.getAction())) {
                PlayerService.this.pause();
            }
        }
    };
    private final AudioManager.OnAudioFocusChangeListener focus = new AudioManager.OnAudioFocusChangeListener() { // from class: com.duha.journey.PlayerService.4
        @Override // android.media.AudioManager.OnAudioFocusChangeListener
        public void onAudioFocusChange(int i) {
            if (i == -1) {
                PlayerService.this.pause();
                return;
            }
            if (i == -2 || i == -3) {
                if (PlayerService.this.paused) {
                    return;
                }
                PlayerService.this.focusPaused = true;
                PlayerService.this.pause();
                return;
            }
            if (i == 1 && PlayerService.this.focusPaused) {
                PlayerService.this.focusPaused = false;
                PlayerService.this.resume();
            }
        }
    };

    @Override // android.app.Service
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override // android.app.Service
    public void onCreate() {
        super.onCreate();
        live = this;
        this.am = (AudioManager) getSystemService("audio");
        PowerManager.WakeLock wakeLockNewWakeLock = ((PowerManager) getSystemService("power")).newWakeLock(1, "duha:player");
        this.wl = wakeLockNewWakeLock;
        wakeLockNewWakeLock.setReferenceCounted(false);
        MediaSession mediaSession = new MediaSession(this, "duha-player");
        this.ms = mediaSession;
        mediaSession.setCallback(new MediaSession.Callback() { // from class: com.duha.journey.PlayerService.5
            @Override // android.media.session.MediaSession.Callback
            public void onPlay() {
                PlayerService.this.resume();
            }

            @Override // android.media.session.MediaSession.Callback
            public void onPause() {
                PlayerService.this.pause();
            }

            @Override // android.media.session.MediaSession.Callback
            public void onSkipToNext() {
                PlayerService.this.skip(1);
            }

            @Override // android.media.session.MediaSession.Callback
            public void onSkipToPrevious() {
                PlayerService.this.skip(-1);
            }

            @Override // android.media.session.MediaSession.Callback
            public void onStop() {
                PlayerService.this.stopAll();
            }
        });
        this.ms.setActive(true);
        if (Build.VERSION.SDK_INT >= 26) {
            NotificationChannel notificationChannel = new NotificationChannel(CH, "مشغّل الحفظ", 2);
            notificationChannel.setShowBadge(false);
            ((NotificationManager) getSystemService("notification")).createNotificationChannel(notificationChannel);
        }
        registerReceiver(this.noisy, new IntentFilter("android.media.AUDIO_BECOMING_NOISY"));
    }

    @Override // android.app.Service
    public int onStartCommand(Intent intent, int i, int i2) {
        String action = intent == null ? null : intent.getAction();
        if ("start".equals(action)) {
            try {
                JSONObject jSONObject = new JSONObject(intent.getStringExtra("plan"));
                this.items = jSONObject.getJSONArray("items");
                this.rate = (float) jSONObject.optDouble("rate", 1.0d);
                this.loop = jSONObject.optBoolean("loop", false);
                this.reciter = jSONObject.optString("reciter", "");
                long jOptLong = jSONObject.optLong("sleepMs", 0L);
                this.sleepAt = jOptLong > 0 ? System.currentTimeMillis() + jOptLong : 0L;
            } catch (Exception unused) {
                this.items = new JSONArray();
            }
            foreground();
            if (!grabFocus()) {
                stopAll();
                return 2;
            }
            this.wl.acquire(14400000L);
            this.paused = false;
            play(0);
        } else if ("pause".equals(action)) {
            pause();
        } else if ("resume".equals(action)) {
            resume();
        } else if ("next".equals(action)) {
            skip(1);
        } else if ("prev".equals(action)) {
            skip(-1);
        } else if ("stop".equals(action)) {
            stopAll();
        } else if ("toggle".equals(action)) {
            if (this.paused) {
                resume();
            } else {
                pause();
            }
        }
        return 2;
    }

    private boolean grabFocus() {
        int iRequestAudioFocus;
        if (Build.VERSION.SDK_INT >= 26) {
            AudioFocusRequest audioFocusRequestBuild = new AudioFocusRequest.Builder(1).setAudioAttributes(new AudioAttributes.Builder().setUsage(1).setContentType(1).build()).setOnAudioFocusChangeListener(this.focus, this.h).build();
            this.afr = audioFocusRequestBuild;
            iRequestAudioFocus = this.am.requestAudioFocus(audioFocusRequestBuild);
        } else {
            iRequestAudioFocus = this.am.requestAudioFocus(this.focus, 3, 1);
        }
        return iRequestAudioFocus == 1;
    }

    public void play(int i) {
        this.h.removeCallbacks(this.tick);
        this.h.removeCallbacks(this.next);
        if (this.sleepAt > 0 && System.currentTimeMillis() > this.sleepAt) {
            stopAll();
            return;
        }
        if (i >= this.items.length()) {
            if (!this.loop || this.items.length() <= 0) {
                report("done");
                stopAll();
                return;
            }
            i = 0;
        }
        if (i < 0) {
            i = 0;
        }
        this.idx = i;
        this.inGap = false;
        try {
            JSONObject jSONObject = this.items.getJSONObject(i);
            if (this.mp == null) {
                MediaPlayer mediaPlayer = new MediaPlayer();
                this.mp = mediaPlayer;
                mediaPlayer.setAudioAttributes(new AudioAttributes.Builder().setUsage(1).setContentType(1).build());
                this.mp.setWakeMode(this, 1);
            }
            this.mp.reset();
            AssetFileDescriptor assetFileDescriptorOpenFd = getAssets().openFd("www/" + jSONObject.getString("f"));
            this.mp.setDataSource(assetFileDescriptorOpenFd.getFileDescriptor(), assetFileDescriptorOpenFd.getStartOffset(), assetFileDescriptorOpenFd.getLength());
            assetFileDescriptorOpenFd.close();
            this.mp.prepare();
            this.endMs = jSONObject.getInt("e");
            if (Build.VERSION.SDK_INT >= 26) {
                this.mp.seekTo(jSONObject.getInt("s"), 3);
            } else {
                this.mp.seekTo(jSONObject.getInt("s"));
            }
            MediaPlayer mediaPlayer2 = this.mp;
            mediaPlayer2.setPlaybackParams(mediaPlayer2.getPlaybackParams().setSpeed(this.rate));
            if (this.paused) {
                this.mp.pause();
            } else {
                this.mp.start();
            }
            this.h.postDelayed(this.tick, 40L);
        } catch (Exception unused) {
            this.h.postDelayed(this.next, 300L);
        }
        refresh();
    }

    public void gapThenNext() {
        long jOptInt;
        this.inGap = true;
        try {
            jOptInt = (long) (this.items.getJSONObject(this.idx).optInt("g", 400) / this.rate);
        } catch (Exception unused) {
            jOptInt = 400;
        }
        refresh();
        this.h.postDelayed(this.next, jOptInt);
    }

    public void pause() {
        if (this.paused) {
            return;
        }
        this.paused = true;
        this.h.removeCallbacks(this.tick);
        this.h.removeCallbacks(this.next);
        try {
            MediaPlayer mediaPlayer = this.mp;
            if (mediaPlayer != null && mediaPlayer.isPlaying()) {
                this.mp.pause();
            }
        } catch (Exception unused) {
        }
        refresh();
    }

    public void resume() {
        if (this.paused) {
            this.paused = false;
            if (this.inGap) {
                play(this.idx + 1);
                return;
            }
            try {
                MediaPlayer mediaPlayer = this.mp;
                if (mediaPlayer != null) {
                    mediaPlayer.start();
                    this.h.postDelayed(this.tick, 40L);
                }
            } catch (Exception unused) {
                play(this.idx);
            }
            refresh();
        }
    }

    public void skip(int i) {
        play(Math.max(0, this.idx + i));
    }

    void stopAll() {
        AudioFocusRequest audioFocusRequest;
        this.h.removeCallbacks(this.tick);
        this.h.removeCallbacks(this.next);
        MediaPlayer mediaPlayer = this.mp;
        if (mediaPlayer != null) {
            try {
                mediaPlayer.release();
            } catch (Exception unused) {
            }
            this.mp = null;
        }
        this.idx = -1;
        this.paused = false;
        this.inGap = false;
        if (Build.VERSION.SDK_INT < 26 || (audioFocusRequest = this.afr) == null) {
            this.am.abandonAudioFocus(this.focus);
        } else {
            this.am.abandonAudioFocusRequest(audioFocusRequest);
        }
        if (this.wl.isHeld()) {
            this.wl.release();
        }
        this.ms.setPlaybackState(new PlaybackState.Builder().setState(1, 0L, 0.0f).build());
        report("idle");
        stopForeground(1);
        stopSelf();
    }

    private String label() {
        try {
            return this.items.getJSONObject(this.idx).optString("l", "");
        } catch (Exception unused) {
            return "";
        }
    }

    private int verse() {
        try {
            return this.items.getJSONObject(this.idx).optInt("n", 0);
        } catch (Exception unused) {
            return 0;
        }
    }

    private void refresh() {
        String str = "سورة الضحى — الآية " + arn(verse());
        MediaSession mediaSession = this.ms;
        mediaSession.setMetadata(new MediaMetadata.Builder().putString("android.media.metadata.TITLE", str).putString("android.media.metadata.ARTIST", this.inGap ? "دورك: أعدها بصوتك" : label()).putString("android.media.metadata.ALBUM", "رحلة الضحى · " + this.reciter).build());
        MediaSession mediaSession2 = this.ms;
        PlaybackState.Builder actions = new PlaybackState.Builder().setActions(567L);
        boolean z = this.paused;
        mediaSession2.setPlaybackState(actions.setState(z ? 2 : 3, 0L, z ? 0.0f : this.rate).build());
        ((NotificationManager) getSystemService("notification")).notify(7, build(str));
        report(this.paused ? "paused" : "playing");
    }

    private void foreground() {
        Notification notificationBuild = build("سورة الضحى");
        if (Build.VERSION.SDK_INT >= 29) {
            startForeground(7, notificationBuild, 2);
        } else {
            startForeground(7, notificationBuild);
        }
    }

    private PendingIntent act(String str, int i) {
        return PendingIntent.getService(this, i, new Intent(this, (Class<?>) PlayerService.class).setAction(str), 67108864 | 134217728);
    }

    private Notification build(String str) {
        Notification.Builder builder = Build.VERSION.SDK_INT >= 26 ? new Notification.Builder(this, CH) : new Notification.Builder(this);
        PendingIntent activity = PendingIntent.getActivity(this, 0, new Intent(this, (Class<?>) MainActivity.class), 67108864 | 134217728);
        int i = android.R.drawable.ic_media_play;
        Notification.Builder builderAddAction = builder.setSmallIcon(android.R.drawable.ic_media_play).setContentTitle(str).setContentText(this.inGap ? "دورك: أعدها بصوتك" : label()).setContentIntent(activity).setOngoing(!this.paused).setShowWhen(false).setVisibility(1).addAction(new Notification.Action.Builder(android.R.drawable.ic_media_previous, "السابق", act("prev", 1)).build());
        boolean z = this.paused;
        if (!z) {
            i = android.R.drawable.ic_media_pause;
        }
        builderAddAction.addAction(new Notification.Action.Builder(i, z ? "تشغيل" : "إيقاف مؤقت", act("toggle", 2)).build()).addAction(new Notification.Action.Builder(android.R.drawable.ic_media_next, "التالي", act("next", 3)).build()).addAction(new Notification.Action.Builder(android.R.drawable.ic_menu_close_clear_cancel, "إيقاف", act("stop", 4)).build()).setStyle(new Notification.MediaStyle().setMediaSession(this.ms.getSessionToken()).setShowActionsInCompactView(0, 1, 2));
        return builder.build();
    }

    static String arn(int i) {
        String strValueOf = String.valueOf(i);
        StringBuilder sb = new StringBuilder();
        for (char cCharAt : strValueOf.toCharArray()) {
            if (cCharAt >= '0' && cCharAt <= '9') {
                cCharAt = "٠١٢٣٤٥٦٧٨٩".charAt(cCharAt - '0');
            }
            sb.append(cCharAt);
        }
        return sb.toString();
    }

    String state() {
        String str;
        try {
            JSONObject jSONObject = new JSONObject();
            if (this.idx < 0) {
                str = "idle";
            } else {
                str = this.paused ? "paused" : "playing";
            }
            jSONObject.put("state", str);
            jSONObject.put("i", this.idx);
            jSONObject.put("total", this.items.length());
            jSONObject.put("gap", this.inGap);
            jSONObject.put("n", this.idx < 0 ? 0 : verse());
            jSONObject.put("label", this.idx < 0 ? "" : label());
            return jSONObject.toString();
        } catch (Exception unused) {
            return "{}";
        }
    }

    private void report(String str) {
        MainActivity mainActivity = MainActivity.live;
        if (mainActivity == null) {
            return;
        }
        String strState = state();
        if ("done".equals(str)) {
            strState = "{\"state\":\"idle\"}";
        }
        mainActivity.ppReport(strState);
    }

    @Override // android.app.Service
    public void onDestroy() {
        try {
            unregisterReceiver(this.noisy);
        } catch (Exception unused) {
        }
        this.h.removeCallbacksAndMessages(null);
        MediaPlayer mediaPlayer = this.mp;
        if (mediaPlayer != null) {
            try {
                mediaPlayer.release();
            } catch (Exception unused2) {
            }
            this.mp = null;
        }
        PowerManager.WakeLock wakeLock = this.wl;
        if (wakeLock != null && wakeLock.isHeld()) {
            this.wl.release();
        }
        this.ms.release();
        live = null;
        super.onDestroy();
    }
}
