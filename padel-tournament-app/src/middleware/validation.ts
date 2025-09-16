import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';

export const validateTournamentCreation = [
    body('name').isString().notEmpty().withMessage('El nombre del torneo es obligatorio.'),
    body('date').isISO8601().withMessage('La fecha del torneo debe ser una fecha válida.'),
    body('teams').isArray().withMessage('Los equipos deben ser un array.'),
    body('teams.*.name').isString().notEmpty().withMessage('El nombre del equipo es obligatorio.'),
    (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];

export const validateClubRegistration = [
    body('name').isString().notEmpty().withMessage('El nombre del club es obligatorio.'),
    body('location').isString().notEmpty().withMessage('La ubicación del club es obligatoria.'),
    (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];

export const validatePlayerRegistration = [
    body('name').isString().notEmpty().withMessage('El nombre del jugador es obligatorio.'),
    body('age').isInt({ min: 0 }).withMessage('La edad del jugador debe ser un número positivo.'),
    body('clubId').isString().notEmpty().withMessage('El ID del club es obligatorio.'),
    (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];