import connectToDatabase from "../../../../Lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(req, { params }) {
    try {
        const { db } = await connectToDatabase();
        const bucket = new GridFSBucket(db, { bucketName: "photos" });
        const fileId = params.fileId;

        if (!ObjectId.isValid(fileId)) {
            return new NextResponse("Invalid file ID", { status: 400 });
        }

        const stream = bucket.openDownloadStream(new ObjectId(fileId));
        return new NextResponse(stream, {
            headers: { "Content-Type": "image/jpeg" }  // Adjust the content type as per your file type
        });
    } catch (error) {
        console.error("Error fetching file:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
