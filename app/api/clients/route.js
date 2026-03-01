// pages/api/clients/index.js
import { NextResponse } from 'next/server';
import connectToDatabase from "../../../Lib/mongodb";
import Client from '../../../models/client';

export async function POST(request) {
    await connectToDatabase(); // Connect to the database

    try {
        const clientData = await request.json(); // Parse JSON from the request body
        const newClient = new Client(clientData); // Create a new Client instance
        const savedClient = await newClient.save(); // Save the client to the database
        return NextResponse.json(savedClient, { status: 201 }); // Respond with saved client data
    } catch (error) {
        console.error("Error saving client:", error);
        return NextResponse.json({ message: 'Failed to save client', error }, { status: 500 });
    }
}