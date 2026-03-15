import { Request, Response } from "express";

const COUNTRIES = [
    "Afghanistan", "Albania", "Algeria", "Argentina", "Australia", 
    "Austria", "Bangladesh", "Belgium", "Brazil", "Canada", 
    "China", "Denmark", "Egypt", "France", "Germany", 
    "India", "Indonesia", "Italy", "Japan", "Malaysia", 
    "Netherlands", "Norway", "Philippines", "Singapore", "South Korea", 
    "Spain", "Sweden", "Thailand", "United Kingdom", "United States", 
    "Vietnam"
];

export async function getCountries(req: Request, res: Response) {
    try {
        const sortedCountries = COUNTRIES.sort();
        res.json({
            success: true,
            message: "Countries retrieved successfully",
            data: sortedCountries
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to get countries"
        });
    }
}