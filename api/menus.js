const express = require('express');
const menusRouter = express.Router();

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

const menuItemsRouter = require('./menu-items');

menusRouter.use('/:menuId/menu-items', menuItemsRouter);

menusRouter.get('/', (req, res, next) => {
    db.all(`SELECT * FROM Menu`, (error, rows) => {
        if(error) {
            next(error);
        } else {
            res.status(200).json( {menus: rows} );
        }
    });
});

menusRouter.post('/', (req, res, next) => {
    let newMenu = req.body.menu;

    if(!newMenu.title) {
        return res.status(400).send();
    };

    db.run(`INSERT INTO Menu (title) VALUES ($title)`, {$title : newMenu.title},
    function (error) {
        if(error) {
            next(error);
        } else {
            db.get(`SELECT * FROM Menu WHERE id = ${this.lastID}`, (error, row) => {
                if(error) {
                    next(error);
                } else {
                    res.status(201).json( {menu: row} );
                }
            });
        }

    });
});

menusRouter.param('menuId', (req, res, next, id) => {
    let menuId = Number(id);

    db.get(`SELECT * FROM Menu WHERE id = ${menuId}`, (error, row) => {
        if(error) {
            next(error);
        } else if(!row) {
            return res.status(404).send();
        } else {
            req.menu = row;
            next();
        }
    });
});

menusRouter.get('/:menuId', (req, res, next) => {
    res.status(200).json( {menu: req.menu} );
});

menusRouter.put('/:menuId', (req, res, next) => {
    let menuToUpdate = req.body.menu;

    if(!menuToUpdate.title) {
        return res.status(400).send();
    };

    db.run(`UPDATE Menu SET title = $title WHERE id = ${req.params.menuId}`,
    {$title : menuToUpdate.title},
    error => {
        if(error) {
            next(error);
        } else {
            db.get(`SELECT * FROM Menu WHERE id = ${req.params.menuId}`, (error, row) => {
                if(error) {
                    next(error);
                } else {
                    res.status(200).json( {menu: row} );
                }
            });
        }

    });
});

// has to be completed with menuItems logic

menusRouter.delete('/:menuId', (req, res, next) => {

    db.get(`SELECT * FROM MenuItem WHERE menu_id = ${req.params.menuId}`,
    (error, row) => {
        if(error) {
            next(error);
        } else if(!row) {
            db.run(`DELETE FROM Menu WHERE id = ${req.params.menuId}`, error => {
                if(error) {
                    next(error);
                } else {
                    res.status(204).send();
                }
            });
        } else {
            return res.status(400).send();
        }
    });

});

menuItemsRouter.get('/', (req, res, next) => {
    db.all(`SELECT * FROM MenuItem WHERE menu_id = ${req.menu.id}`, 
    (error, rows) => {
        if(error) {
            next(error);
        } else {
            res.status(200).json( {menuItems: rows} );
        }
    });

});

menuItemsRouter.post('/', (req, res, next) => {
    let newMenuItem = req.body.menuItem;

    if(!newMenuItem.name || !newMenuItem.description || !newMenuItem.inventory || !newMenuItem.price) {
        return res.status(400).send();
    };


    db.run(`INSERT INTO MenuItem (name, description, inventory, price, menu_id)
    VALUES ($name, $description, $inventory, $price, $menu_id)`,
    {$name: newMenuItem.name, $description: newMenuItem.description, $inventory: newMenuItem.inventory, $price: newMenuItem.price, $menu_id: req.menu.id},
    function (error) {
        if(error) {
            next(error);
        } else {
            db.get(`SELECT * FROM MenuItem WHERE id = ${this.lastID}`,
            (error, row) => {
                if(error) {
                    next(error);
                } else {
                    res.status(201).json( {menuItem: row} );
                }
            });
        }
    });
});

menuItemsRouter.param('menuItemId', (req, res, next, id) => {
    let menuItemId = Number(id);

     db.get(`SELECT * FROM MenuItem WHERE id = ${menuItemId}`, 
     (error, row) => {
         if(error) {
             next(error);
         } else if(!row) {
             return res.status(404).send();
         } else {
             req.menuItem = row;
             next();
         }
     });
});

menuItemsRouter.put('/:menuItemId', (req, res, next) => {
    let menuItemToUpdate = req.body.menuItem;

    if(!menuItemToUpdate.name || !menuItemToUpdate.description || !menuItemToUpdate.inventory || !menuItemToUpdate.price) {
        return res.status(400).send();
    };

    db.run(`UPDATE MenuItem SET name = $name, description = $description, inventory = $inventory, price = $price, menu_id = $menu_id WHERE id=${req.params.menuItemId}`,
    {$name: menuItemToUpdate.name, $description: menuItemToUpdate.description, $inventory: menuItemToUpdate.inventory, $price: menuItemToUpdate.price, $menu_id: req.menu.id},
    error => {
        if(error) {
            next(error);
        } else {
            db.get(`SELECT * FROM MenuItem WHERE id = ${req.params.menuItemId}`,
            (error, row) => {
                if(error) {
                    next(error);
                } else {
                    res.status(200).json( {menuItem: row} );
                }
            });
        }
    });
});

menuItemsRouter.delete('/:menuItemId', (req, res, next) => {
    db.run(`DELETE FROM MenuItem WHERE id=${req.params.menuItemId}`,
    error => {
        if(error) {
            next(error);
        } else {
            res.status(204).send();
        }
    });
});

module.exports = menusRouter;