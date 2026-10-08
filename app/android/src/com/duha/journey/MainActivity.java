package com.duha.journey;

import android.app.Activity;
import android.content.ContentValues;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.CancellationSignal;
import android.os.Environment;
import android.os.ParcelFileDescriptor;
import android.print.PageRange;
import android.print.PrintAttributes;
import android.print.PrintDocumentAdapter;
import android.print.PrintDocumentInfo;
import android.print.PrintManager;
import android.provider.MediaStore;
import android.speech.RecognitionListener;
import android.speech.SpeechRecognizer;
import android.util.Base64;
import android.webkit.JavascriptInterface;
import android.webkit.PermissionRequest;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;
import org.json.JSONObject;

public class MainActivity extends Activity {
    private static final String HOST = "appassets.androidplatform.net";
    private static final int REQ_LISTEN = 7;
    private static final int REQ_NOTIFY = 9;
    private static final int REQ_WEBMIC = 8;
    private static final String START = "https://appassets.androidplatform.net/index.html";
    static MainActivity live;
    private boolean listening;
    private PermissionRequest pendingMic;
    private String[] pendingRes;
    private SpeechRecognizer sr;
    private int srErrors;
    private WebView web;

    @Override // android.app.Activity
    protected void onCreate(Bundle bundle) {
        super.onCreate(bundle);
        live = this;
        WebView webView = new WebView(this);
        this.web = webView;
        webView.setBackgroundColor(Color.parseColor("#080C1D"));
        this.web.setOverScrollMode(2);
        WebSettings settings = this.web.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setTextZoom(100);
        this.web.addJavascriptInterface(new Bridge(), "DuhaApp");
        this.web.setWebChromeClient(new WebChromeClient() { // from class: com.duha.journey.MainActivity.1
            @Override // android.webkit.WebChromeClient
            public void onPermissionRequest(final PermissionRequest permissionRequest) {
                MainActivity.this.runOnUiThread(new Runnable() { // from class: com.duha.journey.MainActivity.1.1
                    @Override // java.lang.Runnable
                    public void run() {
                        ArrayList arrayList = new ArrayList();
                        ArrayList arrayList2 = new ArrayList();
                        for (String str : permissionRequest.getResources()) {
                            if ("android.webkit.resource.AUDIO_CAPTURE".equals(str)) {
                                arrayList.add(str);
                                if (!MainActivity.this.hasMic()) {
                                    arrayList2.add("android.permission.RECORD_AUDIO");
                                }
                            }
                            if ("android.webkit.resource.VIDEO_CAPTURE".equals(str)) {
                                arrayList.add(str);
                                if (!MainActivity.this.hasCam()) {
                                    arrayList2.add("android.permission.CAMERA");
                                }
                            }
                        }
                        if (arrayList.isEmpty()) {
                            permissionRequest.deny();
                            return;
                        }
                        if (arrayList2.isEmpty()) {
                            permissionRequest.grant((String[]) arrayList.toArray(new String[0]));
                            return;
                        }
                        MainActivity.this.pendingMic = permissionRequest;
                        MainActivity.this.pendingRes = (String[]) arrayList.toArray(new String[0]);
                        MainActivity.this.requestPermissions((String[]) arrayList2.toArray(new String[0]), MainActivity.REQ_WEBMIC);
                    }
                });
            }
        });
        this.web.setWebViewClient(new WebViewClient() { // from class: com.duha.journey.MainActivity.2
            @Override // android.webkit.WebViewClient
            public WebResourceResponse shouldInterceptRequest(WebView webView2, WebResourceRequest webResourceRequest) {
                Uri url = webResourceRequest.getUrl();
                if (MainActivity.HOST.equals(url.getHost())) {
                    return MainActivity.this.serve(url.getPath(), webResourceRequest.getRequestHeaders());
                }
                return null;
            }

            @Override // android.webkit.WebViewClient
            public boolean shouldOverrideUrlLoading(WebView webView2, WebResourceRequest webResourceRequest) {
                Uri url = webResourceRequest.getUrl();
                if (MainActivity.HOST.equals(url.getHost())) {
                    return false;
                }
                try {
                    MainActivity.this.startActivity(new Intent("android.intent.action.VIEW", url));
                    return true;
                } catch (Exception unused) {
                    return true;
                }
            }
        });
        setContentView(this.web);
        if (bundle != null) {
            this.web.restoreState(bundle);
        } else {
            this.web.loadUrl(START);
        }
    }

    public WebResourceResponse serve(String str, Map<String, String> map) {
        if (str == null || str.isEmpty() || str.equals("/")) {
            str = "/index.html";
        }
        if (str.contains("..")) {
            return notFound();
        }
        try {
            byte[] all = readAll(getAssets().open("www" + str));
            String strMime = mime(str);
            String value = null;
            String str2 = (strMime.startsWith("text/") || strMime.endsWith("javascript") || strMime.endsWith("json")) ? "utf-8" : null;
            HashMap map2 = new HashMap();
            map2.put("Accept-Ranges", "bytes");
            map2.put("Access-Control-Allow-Origin", "*");
            if (map != null) {
                for (Map.Entry<String, String> entry : map.entrySet()) {
                    if ("range".equalsIgnoreCase(entry.getKey())) {
                        value = entry.getValue();
                    }
                }
            }
            if (value != null && value.startsWith("bytes=")) {
                try {
                    String[] strArrSplit = value.substring(6).split("-", -1);
                    int i = 0;
                    if (!strArrSplit[0].isEmpty()) {
                        i = Integer.parseInt(strArrSplit[0].trim());
                    }
                    int iMin = Math.min((strArrSplit.length <= 1 || strArrSplit[1].trim().isEmpty()) ? all.length - 1 : Integer.parseInt(strArrSplit[1].trim()), all.length - 1);
                    if (i <= iMin) {
                        byte[] bArrCopyOfRange = Arrays.copyOfRange(all, i, iMin + 1);
                        map2.put("Content-Range", "bytes " + i + "-" + iMin + "/" + all.length);
                        map2.put("Content-Length", String.valueOf(bArrCopyOfRange.length));
                        return new WebResourceResponse(strMime, str2, 206, "Partial Content", map2, new ByteArrayInputStream(bArrCopyOfRange));
                    }
                } catch (NumberFormatException unused) {
                }
            }
            map2.put("Content-Length", String.valueOf(all.length));
            return new WebResourceResponse(strMime, str2, 200, "OK", map2, new ByteArrayInputStream(all));
        } catch (IOException unused2) {
            return notFound();
        }
    }

    private static WebResourceResponse notFound() {
        return new WebResourceResponse("text/plain", "utf-8", 404, "Not Found", new HashMap(), new ByteArrayInputStream(new byte[0]));
    }

    private static byte[] readAll(InputStream inputStream) throws IOException {
        try {
            ByteArrayOutputStream byteArrayOutputStream = new ByteArrayOutputStream(Math.max(inputStream.available(), 8192));
            byte[] bArr = new byte[16384];
            while (true) {
                int i = inputStream.read(bArr);
                if (i <= 0) {
                    return byteArrayOutputStream.toByteArray();
                }
                byteArrayOutputStream.write(bArr, 0, i);
            }
        } finally {
            inputStream.close();
        }
    }

    private static String mime(String str) {
        String lowerCase = str.toLowerCase();
        if (lowerCase.endsWith(".html")) {
            return "text/html";
        }
        if (lowerCase.endsWith(".css")) {
            return "text/css";
        }
        if (lowerCase.endsWith(".js")) {
            return "text/javascript";
        }
        if (lowerCase.endsWith(".mp3")) {
            return "audio/mpeg";
        }
        if (lowerCase.endsWith(".woff2")) {
            return "font/woff2";
        }
        if (lowerCase.endsWith(".png")) {
            return "image/png";
        }
        if (lowerCase.endsWith(".jpg") || lowerCase.endsWith(".jpeg")) {
            return "image/jpeg";
        }
        if (lowerCase.endsWith(".webp")) {
            return "image/webp";
        }
        if (lowerCase.endsWith(".mp4")) {
            return "video/mp4";
        }
        if (lowerCase.endsWith(".svg")) {
            return "image/svg+xml";
        }
        return lowerCase.endsWith(".json") ? "application/json" : "application/octet-stream";
    }

    public void shareImage(String str, String str2) {
        OutputStream outputStreamOpenOutputStream;
        int i = 0;
        try {
            byte[] bArrDecode = Base64.decode(str, 0);
            String strReplaceAll = str2 == null ? "duha.png" : str2.replaceAll("[^A-Za-z0-9._-]", "_");
            if (!strReplaceAll.endsWith(".png")) {
                strReplaceAll = strReplaceAll + ".png";
            }
            if (Build.VERSION.SDK_INT >= 29) {
                try {
                    ContentValues contentValues = new ContentValues();
                    contentValues.put("_display_name", strReplaceAll.substring(0, strReplaceAll.length() - 4) + "_" + System.currentTimeMillis() + ".png");
                    contentValues.put("mime_type", "image/png");
                    StringBuilder sb = new StringBuilder();
                    sb.append(Environment.DIRECTORY_PICTURES);
                    sb.append("/RihlatAlDuha");
                    contentValues.put("relative_path", sb.toString());
                    Uri uriInsert = getContentResolver().insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, contentValues);
                    if (uriInsert != null && (outputStreamOpenOutputStream = getContentResolver().openOutputStream(uriInsert)) != null) {
                        outputStreamOpenOutputStream.write(bArrDecode);
                        outputStreamOpenOutputStream.close();
                        i = 1;
                    }
                } catch (Exception unused) {
                }
            }
            File file = new File(getCacheDir(), "share");
            file.mkdirs();
            FileOutputStream fileOutputStream = new FileOutputStream(new File(file, strReplaceAll));
            fileOutputStream.write(bArrDecode);
            fileOutputStream.close();
            Intent intent = new Intent("android.intent.action.SEND");
            intent.setType("image/png");
            intent.putExtra("android.intent.extra.STREAM", Uri.parse("content://" + getPackageName() + ".share/" + strReplaceAll));
            intent.addFlags(1);
            this.web.evaluateJavascript("window.__saved && window.__saved(" + i + ")", null);
            startActivity(Intent.createChooser(intent, i != 0 ? "حُفظت في الصور — أرسلها لمن تحب" : "احفظ الصورة أو أرسلها"));
        } catch (Exception unused2) {
            this.web.evaluateJavascript("window.toast && toast('تعذّر حفظ الصورة','x')", null);
        }
    }

    public void shareFile(String str, String str2, String str3) {
        OutputStream outputStreamOpenOutputStream;
        int i = 0;
        try {
            byte[] bArrDecode = Base64.decode(str, 0);
            String strReplaceAll = str2 == null ? "duha.pdf" : str2.replaceAll("[^A-Za-z0-9._-]", "_");
            if (Build.VERSION.SDK_INT >= 29) {
                try {
                    ContentValues contentValues = new ContentValues();
                    contentValues.put("_display_name", strReplaceAll);
                    contentValues.put("mime_type", str3);
                    contentValues.put("relative_path", Environment.DIRECTORY_DOWNLOADS + "/RihlatAlDuha");
                    Uri uriInsert = getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, contentValues);
                    if (uriInsert != null && (outputStreamOpenOutputStream = getContentResolver().openOutputStream(uriInsert)) != null) {
                        outputStreamOpenOutputStream.write(bArrDecode);
                        outputStreamOpenOutputStream.close();
                        i = 1;
                    }
                } catch (Exception unused) {
                }
            }
            File file = new File(getCacheDir(), "share");
            file.mkdirs();
            FileOutputStream fileOutputStream = new FileOutputStream(new File(file, strReplaceAll));
            fileOutputStream.write(bArrDecode);
            fileOutputStream.close();
            Intent intent = new Intent("android.intent.action.SEND");
            intent.setType(str3);
            intent.putExtra("android.intent.extra.STREAM", Uri.parse("content://" + getPackageName() + ".share/" + strReplaceAll));
            intent.addFlags(1);
            js("window.__fileSaved && window.__fileSaved(" + i + ")");
            startActivity(Intent.createChooser(intent, i != 0 ? "حُفظ في التنزيلات — أرسله أو افتحه" : "احفظ الملف أو أرسله"));
        } catch (Exception unused2) {
            js("window.toast && toast('تعذّر حفظ الملف','x')");
        }
    }

    public void printPdf(String str, final String str2) {
        try {
            final File file = new File(new File(getCacheDir(), "share"), "print.pdf");
            file.getParentFile().mkdirs();
            FileOutputStream fileOutputStream = new FileOutputStream(file);
            fileOutputStream.write(Base64.decode(str, 0));
            fileOutputStream.close();
            ((PrintManager) getSystemService("print")).print(str2, new PrintDocumentAdapter() { // from class: com.duha.journey.MainActivity.3
                @Override // android.print.PrintDocumentAdapter
                public void onLayout(PrintAttributes printAttributes, PrintAttributes printAttributes2, CancellationSignal cancellationSignal, PrintDocumentAdapter.LayoutResultCallback layoutResultCallback, Bundle bundle) {
                    if (cancellationSignal.isCanceled()) {
                        layoutResultCallback.onLayoutCancelled();
                    } else {
                        layoutResultCallback.onLayoutFinished(new PrintDocumentInfo.Builder(str2).setContentType(0).build(), true);
                    }
                }

                @Override // android.print.PrintDocumentAdapter
                public void onWrite(PageRange[] pageRangeArr, ParcelFileDescriptor parcelFileDescriptor, CancellationSignal cancellationSignal, PrintDocumentAdapter.WriteResultCallback writeResultCallback) {
                    try {
                        FileInputStream fileInputStream = new FileInputStream(file);
                        FileOutputStream fileOutputStream2 = new FileOutputStream(parcelFileDescriptor.getFileDescriptor());
                        byte[] bArr = new byte[16384];
                        while (true) {
                            int i = fileInputStream.read(bArr);
                            if (i <= 0) {
                                fileInputStream.close();
                                fileOutputStream2.close();
                                writeResultCallback.onWriteFinished(new PageRange[]{PageRange.ALL_PAGES});
                                return;
                            }
                            fileOutputStream2.write(bArr, 0, i);
                        }
                    } catch (Exception e) {
                        writeResultCallback.onWriteFailed(e.getMessage());
                    }
                }
            }, null);
        } catch (Exception unused) {
            js("window.toast && toast('تعذّرت الطباعة هنا','x')");
        }
    }

    public void immersive(boolean z) {
        setRequestedOrientation(z ? 6 : -1);
        getWindow().getDecorView().setSystemUiVisibility(z ? 5894 : 0);
        if (z) {
            getWindow().addFlags(128);
        } else {
            getWindow().clearFlags(128);
        }
    }

    public boolean hasCam() {
        return checkSelfPermission("android.permission.CAMERA") == 0;
    }

    public boolean hasMic() {
        return checkSelfPermission("android.permission.RECORD_AUDIO") == 0;
    }

    public void js(String str) {
        WebView webView = this.web;
        if (webView != null) {
            webView.evaluateJavascript(str, null);
        }
    }

    public void srEvent(String str, String str2) {
        StringBuilder sb = new StringBuilder("window.__sr && window.__sr('");
        sb.append(str);
        sb.append("',");
        sb.append(str2 == null ? "null" : JSONObject.quote(str2));
        sb.append(")");
        js(sb.toString());
    }

    public void startListening() {
        if (!hasMic()) {
            requestPermissions(new String[]{"android.permission.RECORD_AUDIO"}, REQ_LISTEN);
            return;
        }
        if (!SpeechRecognizer.isRecognitionAvailable(this)) {
            srEvent("error", "unavailable");
            return;
        }
        if (this.sr == null) {
            SpeechRecognizer speechRecognizerCreateSpeechRecognizer = SpeechRecognizer.createSpeechRecognizer(this);
            this.sr = speechRecognizerCreateSpeechRecognizer;
            speechRecognizerCreateSpeechRecognizer.setRecognitionListener(new RecognitionListener() { // from class: com.duha.journey.MainActivity.4
                @Override // android.speech.RecognitionListener
                public void onBeginningOfSpeech() {
                }

                @Override // android.speech.RecognitionListener
                public void onBufferReceived(byte[] bArr) {
                }

                @Override // android.speech.RecognitionListener
                public void onEndOfSpeech() {
                }

                @Override // android.speech.RecognitionListener
                public void onEvent(int i, Bundle bundle) {
                }

                @Override // android.speech.RecognitionListener
                public void onReadyForSpeech(Bundle bundle) {
                }

                @Override // android.speech.RecognitionListener
                public void onRmsChanged(float f) {
                }

                private String first(Bundle bundle) {
                    ArrayList<String> stringArrayList = bundle == null ? null : bundle.getStringArrayList("results_recognition");
                    return (stringArrayList == null || stringArrayList.isEmpty()) ? "" : stringArrayList.get(0);
                }

                @Override // android.speech.RecognitionListener
                public void onPartialResults(Bundle bundle) {
                    MainActivity.this.srErrors = 0;
                    MainActivity.this.srEvent("partial", first(bundle));
                }

                @Override // android.speech.RecognitionListener
                public void onResults(Bundle bundle) {
                    MainActivity.this.srErrors = 0;
                    MainActivity.this.srEvent("final", first(bundle));
                    MainActivity.this.again();
                }

                @Override // android.speech.RecognitionListener
                public void onError(int err) {
                    if (err == SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS) {
                        MainActivity.this.listening = false;
                        MainActivity.this.srEvent("error", "denied");
                        return;
                    }
                    if (err != SpeechRecognizer.ERROR_NO_MATCH && err != SpeechRecognizer.ERROR_SPEECH_TIMEOUT && ++MainActivity.this.srErrors > 6) {
                        MainActivity.this.listening = false;
                        MainActivity.this.srEvent("error", "failed");
                    } else if (err == SpeechRecognizer.ERROR_RECOGNIZER_BUSY || err == SpeechRecognizer.ERROR_CLIENT) {
                        MainActivity.this.web.postDelayed(new Runnable() {
                            @Override
                            public void run() {
                                MainActivity.this.again();
                            }
                        }, 400L);
                    } else {
                        MainActivity.this.again();
                    }
                }
            });
        }
        this.listening = true;
        this.srErrors = 0;
        listenOnce();
    }

    private void listenOnce() {
        Intent intent = new Intent("android.speech.action.RECOGNIZE_SPEECH");
        intent.putExtra("android.speech.extra.LANGUAGE_MODEL", "free_form");
        intent.putExtra("android.speech.extra.LANGUAGE", "ar-SA");
        intent.putExtra("android.speech.extra.PARTIAL_RESULTS", true);
        intent.putExtra("android.speech.extra.MAX_RESULTS", 1);
        intent.putExtra("android.speech.extras.SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS", 3500L);
        intent.putExtra("android.speech.extras.SPEECH_INPUT_POSSIBLY_COMPLETE_SILENCE_LENGTH_MILLIS", 3000L);
        try {
            this.sr.startListening(intent);
        } catch (Exception unused) {
            srEvent("error", "start");
        }
    }

    public void again() {
        SpeechRecognizer speechRecognizer;
        if (!this.listening || (speechRecognizer = this.sr) == null) {
            srEvent("end", null);
        } else {
            try {
                speechRecognizer.cancel();
            } catch (Exception unused) {
            }
            listenOnce();
        }
    }

    public void stopListening() {
        this.listening = false;
        SpeechRecognizer speechRecognizer = this.sr;
        if (speechRecognizer != null) {
            try {
                speechRecognizer.stopListening();
                this.sr.cancel();
            } catch (Exception unused) {
            }
        }
        srEvent("end", null);
    }

    @Override // android.app.Activity
    public void onRequestPermissionsResult(int i, String[] strArr, int[] iArr) {
        boolean z = iArr.length > 0 && iArr[0] == 0;
        if (i == REQ_LISTEN) {
            if (z) {
                startListening();
            } else {
                srEvent("error", "denied");
            }
        }
        if (i == REQ_NOTIFY && !z) {
            js("window.toast && toast('لن تصلك التذكيرات حتى تسمح بالإشعارات من إعدادات الجوال','timer')");
        }
        if (i != REQ_WEBMIC || this.pendingMic == null) {
            return;
        }
        ArrayList arrayList = new ArrayList();
        for (String str : this.pendingRes) {
            if ("android.webkit.resource.AUDIO_CAPTURE".equals(str) && hasMic()) {
                arrayList.add(str);
            }
            if ("android.webkit.resource.VIDEO_CAPTURE".equals(str) && hasCam()) {
                arrayList.add(str);
            }
        }
        if (arrayList.isEmpty()) {
            this.pendingMic.deny();
        } else {
            this.pendingMic.grant((String[]) arrayList.toArray(new String[0]));
        }
        this.pendingMic = null;
        this.pendingRes = null;
    }

    private class Bridge {
        private Bridge() {
        }

        @JavascriptInterface
        public void syncWidget(String str) {
            DuhaWidget.save(MainActivity.this, str);
        }

        @JavascriptInterface
        public void setReminders(String str) {
            ReminderReceiver.save(MainActivity.this, str);
            if (str == null || str.length() <= 2 || Build.VERSION.SDK_INT < 33 || MainActivity.this.checkSelfPermission("android.permission.POST_NOTIFICATIONS") == 0) {
                return;
            }
            MainActivity.this.runOnUiThread(new Runnable() { // from class: com.duha.journey.MainActivity.Bridge.1
                @Override // java.lang.Runnable
                public void run() {
                    MainActivity.this.requestPermissions(new String[]{"android.permission.POST_NOTIFICATIONS"}, MainActivity.REQ_NOTIFY);
                }
            });
        }

        @JavascriptInterface
        public void listen(final boolean z) {
            MainActivity.this.runOnUiThread(new Runnable() { // from class: com.duha.journey.MainActivity.Bridge.2
                @Override // java.lang.Runnable
                public void run() {
                    if (z) {
                        MainActivity.this.startListening();
                    } else {
                        MainActivity.this.stopListening();
                    }
                }
            });
        }

        @JavascriptInterface
        public void shareImage(final String str, final String str2) {
            MainActivity.this.runOnUiThread(new Runnable() { // from class: com.duha.journey.MainActivity.Bridge.3
                @Override // java.lang.Runnable
                public void run() {
                    MainActivity.this.shareImage(str, str2);
                }
            });
        }

        @JavascriptInterface
        public void ppStart(final String str) {
            MainActivity.this.runOnUiThread(new Runnable() { // from class: com.duha.journey.MainActivity.Bridge.4
                @Override // java.lang.Runnable
                public void run() {
                    Intent intentPutExtra = new Intent(MainActivity.this, (Class<?>) PlayerService.class).setAction("start").putExtra("plan", str);
                    if (Build.VERSION.SDK_INT >= 26) {
                        MainActivity.this.startForegroundService(intentPutExtra);
                    } else {
                        MainActivity.this.startService(intentPutExtra);
                    }
                }
            });
        }

        @JavascriptInterface
        public void ppCmd(final String str) {
            MainActivity.this.runOnUiThread(new Runnable() { // from class: com.duha.journey.MainActivity.Bridge.5
                @Override // java.lang.Runnable
                public void run() {
                    if (PlayerService.live == null) {
                        MainActivity.this.js("window.__pp && window.__pp({state:'idle'})");
                    } else {
                        MainActivity.this.startService(new Intent(MainActivity.this, (Class<?>) PlayerService.class).setAction(str));
                    }
                }
            });
        }

        @JavascriptInterface
        public String ppState() {
            PlayerService playerService = PlayerService.live;
            return playerService == null ? "{\"state\":\"idle\"}" : playerService.state();
        }

        @JavascriptInterface
        public void shareFile(final String str, final String str2, final String str3) {
            MainActivity.this.runOnUiThread(new Runnable() { // from class: com.duha.journey.MainActivity.Bridge.6
                @Override // java.lang.Runnable
                public void run() {
                    MainActivity.this.shareFile(str, str2, str3);
                }
            });
        }

        @JavascriptInterface
        public void printPdf(final String str, final String str2) {
            MainActivity.this.runOnUiThread(new Runnable() { // from class: com.duha.journey.MainActivity.Bridge.7
                @Override // java.lang.Runnable
                public void run() {
                    MainActivity.this.printPdf(str, str2);
                }
            });
        }

        @JavascriptInterface
        public void immersive(final boolean z) {
            MainActivity.this.runOnUiThread(new Runnable() { // from class: com.duha.journey.MainActivity.Bridge.8
                @Override // java.lang.Runnable
                public void run() {
                    MainActivity.this.immersive(z);
                }
            });
        }

        @JavascriptInterface
        public void keepAwake(final boolean z) {
            MainActivity.this.runOnUiThread(new Runnable() { // from class: com.duha.journey.MainActivity.Bridge.9
                @Override // java.lang.Runnable
                public void run() {
                    if (z) {
                        MainActivity.this.getWindow().addFlags(128);
                    } else {
                        MainActivity.this.getWindow().clearFlags(128);
                    }
                }
            });
        }
    }

    @Override // android.app.Activity
    protected void onSaveInstanceState(Bundle bundle) {
        super.onSaveInstanceState(bundle);
        this.web.saveState(bundle);
    }

    @Override // android.app.Activity
    public void onBackPressed() {
        this.web.evaluateJavascript("(window.__back && window.__back()) ? 1 : 0", new ValueCallback<String>() { // from class: com.duha.journey.MainActivity.5
            @Override // android.webkit.ValueCallback
            public void onReceiveValue(String str) {
                if ("1".equals(str)) {
                    return;
                }
                MainActivity.super.onBackPressed();
            }
        });
    }

    void ppReport(final String str) {
        runOnUiThread(new Runnable() { // from class: com.duha.journey.MainActivity.6
            @Override // java.lang.Runnable
            public void run() {
                MainActivity.this.js("window.__pp && window.__pp(" + str + ")");
            }
        });
    }

    @Override // android.app.Activity
    protected void onDestroy() {
        if (live == this) {
            live = null;
        }
        SpeechRecognizer speechRecognizer = this.sr;
        if (speechRecognizer != null) {
            try {
                speechRecognizer.destroy();
            } catch (Exception unused) {
            }
            this.sr = null;
        }
        WebView webView = this.web;
        if (webView != null) {
            webView.destroy();
        }
        super.onDestroy();
    }
}
