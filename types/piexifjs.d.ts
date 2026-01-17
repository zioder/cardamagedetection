declare module 'piexifjs' {
    const piexif: {
        load: (data: string) => any;
        dump: (exifObj: any) => string;
        insert: (exifStr: string, imageStr: string) => string;
        remove: (imageStr: string) => string;
        ImageIFD: any;
        ExifIFD: any;
        GPSIFD: any;
        [key: string]: any;
    };
    export default piexif;
}
