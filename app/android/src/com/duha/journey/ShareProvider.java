package com.duha.journey;

import android.content.ContentProvider;
import android.content.ContentValues;
import android.database.Cursor;
import android.database.MatrixCursor;
import android.net.Uri;
import android.os.ParcelFileDescriptor;
import java.io.File;
import java.io.FileNotFoundException;

public class ShareProvider extends ContentProvider {
    @Override // android.content.ContentProvider
    public int delete(Uri uri, String str, String[] strArr) {
        return 0;
    }

    @Override // android.content.ContentProvider
    public Uri insert(Uri uri, ContentValues contentValues) {
        return null;
    }

    @Override // android.content.ContentProvider
    public boolean onCreate() {
        return true;
    }

    @Override // android.content.ContentProvider
    public int update(Uri uri, ContentValues contentValues, String str, String[] strArr) {
        return 0;
    }

    private File file(Uri uri) throws FileNotFoundException {
        String lastPathSegment = uri.getLastPathSegment();
        if (lastPathSegment == null) {
            throw new FileNotFoundException();
        }
        File file = new File(new File(getContext().getCacheDir(), "share"), new File(lastPathSegment).getName());
        if (file.isFile()) {
            return file;
        }
        throw new FileNotFoundException(lastPathSegment);
    }

    @Override // android.content.ContentProvider
    public ParcelFileDescriptor openFile(Uri uri, String str) throws FileNotFoundException {
        return ParcelFileDescriptor.open(file(uri), 268435456);
    }

    @Override // android.content.ContentProvider
    public String getType(Uri uri) {
        String lastPathSegment = uri.getLastPathSegment();
        return (lastPathSegment == null || !lastPathSegment.endsWith(".pdf")) ? "image/png" : "application/pdf";
    }

    @Override // android.content.ContentProvider
    public Cursor query(Uri uri, String[] strArr, String str, String[] strArr2, String str2) {
        try {
            File file = file(uri);
            if (strArr == null) {
                strArr = new String[]{"_display_name", "_size"};
            }
            MatrixCursor matrixCursor = new MatrixCursor(strArr);
            Object[] objArr = new Object[strArr.length];
            for (int i = 0; i < strArr.length; i++) {
                if ("_display_name".equals(strArr[i])) {
                    objArr[i] = file.getName();
                } else if ("_size".equals(strArr[i])) {
                    objArr[i] = Long.valueOf(file.length());
                }
            }
            matrixCursor.addRow(objArr);
            return matrixCursor;
        } catch (FileNotFoundException unused) {
            return null;
        }
    }
}
