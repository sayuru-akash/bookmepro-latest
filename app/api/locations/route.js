import { NextResponse } from 'next/server';
import connectToDatabase from "../../../Lib/mongodb";
import Location from '../../../models/location'; 
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../Lib/auth/nextauth-options'; 

// GET - Fetch locations for a coach
export async function GET(request) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const coachId = searchParams.get('coachId');
    
    if (!coachId) {
      return NextResponse.json(
        { error: 'Coach ID is required' },
        { status: 400 }
      );
    }
    
    const locationDoc = await Location.findOne({ coachId });
    
    // Ensure we always return an array for locations
    return NextResponse.json({
      success: true,
      locations: locationDoc?.locations || [],
      isActive: locationDoc?.isActive || false
    });
    
  } catch (error) {
    console.error('Error fetching locations:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        locations: [] // Ensure locations is always an array
      },
      { status: 500 }
    );
  }
}
    
// POST - Create or update locations for a coach
export async function POST(request) {
  try {
    await connectToDatabase();
    
    const body = await request.json();
    const { coachId, locations } = body;
    
    if (!coachId) {
      return NextResponse.json(
        { error: 'Coach ID is required' },
        { status: 400 }
      );
    }
    
    if (!Array.isArray(locations)) {
      return NextResponse.json(
        { error: 'Locations must be an array' },
        { status: 400 }
      );
    }
    
    if (locations.length > 5) {
      return NextResponse.json(
        { error: 'Maximum 5 locations allowed' },
        { status: 400 }
      );
    }
    
    // Validate and clean locations
    const validLocations = locations
      .filter(location => typeof location === 'string' && location.trim())
      .map(location => location.trim());
    
    // Check for duplicates
    const uniqueLocations = [...new Set(validLocations)];
    
    if (uniqueLocations.length !== validLocations.length) {
      return NextResponse.json(
        { error: 'Duplicate locations are not allowed' },
        { status: 400 }
      );
    }
    
    // Find existing location document or create new one
    let locationDoc = await Location.findOne({ coachId });
    
    if (locationDoc) {
      // Update existing document
      locationDoc.locations = uniqueLocations;
      locationDoc.isActive = uniqueLocations.length > 0;
      await locationDoc.save();
    } else {
      // Create new document
      locationDoc = new Location({
        coachId,
        locations: uniqueLocations,
        isActive: uniqueLocations.length > 0
      });
      await locationDoc.save();
    }
    
    return NextResponse.json({
      success: true,
      message: 'Locations updated successfully',
      data: locationDoc
    });
    
  } catch (error) {
    console.error('Error saving locations:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: error.name === 'ValidationError' ? 400 : 500 }
    );
  }
}

// DELETE - Remove a specific location or all locations for a coach
export async function DELETE(request) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const coachId = searchParams.get('coachId');
    const locationToRemove = searchParams.get('location');
    
    if (!coachId) {
      return NextResponse.json(
        { error: 'Coach ID is required' },
        { status: 400 }
      );
    }
    
    const session = await getServerSession(authOptions);
    if (!session || session.user.id !== coachId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const locationDoc = await Location.findOne({ coachId });
    
    if (!locationDoc) {
      return NextResponse.json(
        { error: 'No locations found for this coach' },
        { status: 404 }
      );
    }
    
    if (locationToRemove) {
      // Remove specific location
      locationDoc.locations = locationDoc.locations.filter(
        loc => loc !== decodeURIComponent(locationToRemove)
      );
      locationDoc.isActive = locationDoc.locations.length > 0;
      await locationDoc.save();
    } else {
      // Remove all locations
      locationDoc.locations = [];
      locationDoc.isActive = false;
      await locationDoc.save();
    }
    
    return NextResponse.json({
      success: true,
      message: locationToRemove ? 'Location removed successfully' : 'All locations removed successfully',
      data: locationDoc
    });
    
  } catch (error) {
    console.error('Error deleting location:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}