const express = require('express');
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

const employeeRouter = express.Router();
const timesheetsRouter = require('./timesheets');

employeeRouter.use('/:employeeId/timesheets', timesheetsRouter);

employeeRouter.get('/', (req, res, next) => {
    db.all(`SELECT * FROM Employee WHERE is_current_employee = 1`, (error, rows) => {
        if(error) {
            next(error);
        } else {
            res.status(200).json( {employees : rows} );
        }
    });
});

employeeRouter.post('/', (req, res, next) => {
    let newEmployee = req.body.employee;

    if(!newEmployee.name || !newEmployee.position || !newEmployee.wage) {
        return res.status(400).send();
    };

    if(!newEmployee.isCurrentEmployee) {
        newEmployee.isCurrentEmployee = 1;
    };

        db.run(`INSERT INTO Employee (name, position, wage, is_current_employee) 
        VALUES ($name, $position, $wage, $isCurrentEmployee)`, 
        {$name: newEmployee.name, $position: newEmployee.position, $wage: newEmployee.wage, $isCurrentEmployee: newEmployee.isCurrentEmployee},
        function (error) {
            if(error) {
                next(error);
            } else {
                db.get(`SELECT * FROM Employee WHERE id = ${this.lastID}`, (error, row) => {
                    
                        res.status(201).json( {employee: row} );
                    
                })
            }
        });
    
});

employeeRouter.param('employeeId', (req, res, next, id) => {
    let employeeId = Number(id);

    db.get(`SELECT * FROM Employee WHERE id = ${employeeId}`, (error, row) => {
        if(error) {
            next(error);
        } else if(!row) {
            return res.status(404).send();
        } else {
            req.employee = row;
            next();
        }
    });
});

employeeRouter.get('/:employeeId', (req, res, next) => {
    res.status(200).json( {employee: req.employee} );

});

employeeRouter.put('/:employeeId', (req, res, next) => {
    let employeeToUpdate = req.body.employee;

    if(!employeeToUpdate.name || !employeeToUpdate.position || !employeeToUpdate.wage) {
        return res.status(400).send();
    };

    if(!employeeToUpdate.isCurrentEmployee) {
        employeeToUpdate.isCurrentEmployee = 1;
    };

        db.run(`UPDATE Employee SET name = $name, position = $position, wage = $wage, is_current_employee = $isCurrentEmployee WHERE id = ${req.params.employeeId}`,
        {$name: employeeToUpdate.name, $position: employeeToUpdate.position, $wage: employeeToUpdate.wage, $isCurrentEmployee: employeeToUpdate.isCurrentEmployee},
        error => {
            if(error) {
                next(error);
            } else {
                db.get(`SELECT * FROM Employee WHERE id = ${req.params.employeeId}`, (error, row) => {
                    if (error) {
                        next(error);
                    } else {
                        res.status(200).json( {employee: row} );
                    }
                });
            }
        }
        );

});

employeeRouter.delete('/:employeeId', (req, res, next) => {
    let employeeToDelete = req.body.employee
    
    db.run(`UPDATE Employee SET is_current_employee = 0 WHERE id = ${req.params.employeeId}`,
    error => {
        if(error) {
            next(error);
        } else {
            db.get(`SELECT * FROM Employee WHERE id = ${req.params.employeeId}`, (error, row) => {
                if (error) {
                    next(error);
                } else {
                    res.status(200).json( {employee: row} );
                }
            });
        }
    });

});

timesheetsRouter.get('/', (req, res, next) => {
    db.all(`SELECT * FROM Timesheet WHERE employee_id = ${req.employee.id}`,
    (error, rows) => {
        if(error) {
            next(error);
        } else {
            res.status(200).json( {timesheets: rows} );
        }
    });
});

timesheetsRouter.post('/', (req, res, next) => {
    let newTimesheet = req.body.timesheet;

    if(!newTimesheet.hours || !newTimesheet.rate||!newTimesheet.date) {
        return res.status(400).send();
    };

    db.run(`INSERT INTO Timesheet (hours, rate, date, employee_id) 
    VALUES ($hours, $rate, $date, $employee_id)`,
    {$hours: newTimesheet.hours, $rate: newTimesheet.rate, $date: newTimesheet.date, $employee_id: req.employee.id},
    function (error) {
        if(error) {
            next(error);
        } else {
            db.get(`SELECT * FROM Timesheet WHERE id = ${this.lastID}`, 
            (error, row) => {
                if(error) {
                    next(error);
                } else {
                    res.status(201).json( {timesheet: row} );
                };
            });
        }
    });
});

timesheetsRouter.param('timesheetId', (req, res, next, id) => {
    let timesheetId = Number(id);

    db.get(`SELECT * FROM Timesheet WHERE id = ${timesheetId}`,
    (error, row) => {
        if(error) {
            next(error);
        } else if(!row) {
            return res.status(404).send();
        } else {
            req.timesheet = row;
            next();
        }
    });
});

timesheetsRouter.put('/:timesheetId', (req, res, next) => {
    let timesheetToUpdate = req.body.timesheet;

    if(!timesheetToUpdate.hours || !timesheetToUpdate.rate||!timesheetToUpdate.date) {
        return res.status(400).send();
    };

    db.run(`UPDATE Timesheet SET hours = $hours, rate = $rate, date = $date, employee_id = $employee_id WHERE id=${req.params.timesheetId}`,
    {$hours: timesheetToUpdate.hours, $rate: timesheetToUpdate.rate, $date: timesheetToUpdate.date, $employee_id: req.employee.id},
    error => {
        if(error) {
            next(error);
        } else {
            db.get(`SELECT * FROM Timesheet WHERE id = ${req.params.timesheetId}`, (error, row) => {
                if(error) {
                    next(error);
                } else {
                    res.status(200).json( {timesheet: row} );
                };
            });
        }
    });

});

timesheetsRouter.delete('/:timesheetId', (req, res, next) => {
    db.run(`DELETE FROM Timesheet WHERE id = ${req.params.timesheetId}`, error => {
        if(error) {
            next(error);
        } else {
            res.status(204).send();
        }
    });
});


module.exports = employeeRouter;